package lmstudio

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var fenceRE = regexp.MustCompile("(?s)^```(?:json)?\\s*(.*?)\\s*```$")

type Client struct {
	baseURL   string
	model     string
	maxTokens int
	http      *http.Client
}

func NewClient(baseURL, model string, maxTokens int) *Client {
	if maxTokens <= 0 {
		maxTokens = 2048
	}
	return &Client{
		baseURL:   baseURL,
		model:     model,
		maxTokens: maxTokens,
		http:      &http.Client{Timeout: 10 * time.Minute},
	}
}

func (c *Client) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/models", nil)
	if err != nil {
		return err
	}
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("lm studio: %s", res.Status)
	}
	return nil
}

func (c *Client) ParseMealJSON(ctx context.Context, transcript string) (json.RawMessage, error) {
	transcript = strings.TrimSpace(transcript)
	if transcript == "" {
		return nil, fmt.Errorf("empty transcript")
	}

	attempts := []int{c.maxTokens}
	if t := c.maxTokens * 2; t > c.maxTokens {
		attempts = append(attempts, min(t, 8192))
	}

	var lastErr error
	for i, maxTok := range attempts {
		useFormat := i == 0
		content, finish, err := c.chatOnce(ctx, transcript, maxTok, useFormat)
		if err != nil {
			lastErr = err
			continue
		}
		content = unwrapMarkdownFence(content)
		content = extractJSONObject(content)
		if content == "" {
			lastErr = fmt.Errorf("empty model output (finish_reason=%q)", finish)
			continue
		}
		var check json.RawMessage
		if err := json.Unmarshal([]byte(content), &check); err != nil {
			lastErr = fmt.Errorf("non-json output: %w", err)
			continue
		}
		return check, nil
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("model returned no usable json")
}

func (c *Client) chatOnce(ctx context.Context, transcript string, maxTokens int, useResponseFormat bool) (content string, finishReason string, err error) {
	// Короткий промпт — меньше шанс, что Qwen съест весь лимит на reasoning.
	system := "Ответ: только один JSON-объект, без markdown и без текста вне JSON. " +
		`Схема: {"items":[{"name":"str","portion":"str","calories_kcal":number}],"summary":"str","raw_transcript":"str"}. ` +
		`items: каждая еда/напиток; raw_transcript: дословно из сообщения пользователя. /no_think`

	user := transcript + "\n/no_think"

	body := map[string]any{
		"model": c.model,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
		"temperature": 0.1,
		"max_tokens":  maxTokens,
	}
	if useResponseFormat {
		body["response_format"] = map[string]string{"type": "json_object"}
	}
	if isQwenModel(c.model) {
		body["chat_template_kwargs"] = map[string]any{"enable_thinking": false}
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return "", "", err
	}

	content, finishReason, err = c.chatCompletion(ctx, raw)
	if err != nil && useResponseFormat {
		delete(body, "response_format")
		raw2, _ := json.Marshal(body)
		return c.chatCompletion(ctx, raw2)
	}
	return content, finishReason, err
}

func (c *Client) chatCompletion(ctx context.Context, body []byte) (string, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return "", "", err
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("lm studio chat: %s: %s", res.Status, string(respBody))
	}

	var parsed struct {
		Choices []struct {
			FinishReason string `json:"finish_reason"`
			Message      struct {
				Content          string `json:"content"`
				ReasoningContent string `json:"reasoning_content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", "", err
	}
	if len(parsed.Choices) == 0 {
		return "", "", fmt.Errorf("lm studio: empty choices")
	}

	ch := parsed.Choices[0]
	finish := ch.FinishReason
	msg := ch.Message

	if s := strings.TrimSpace(msg.Content); s != "" {
		if j := extractJSONObject(s); j != "" {
			return j, finish, nil
		}
		return s, finish, nil
	}

	// Qwen3: JSON иногда только в reasoning_content; не отдаём сырой reasoning клиенту.
	if s := strings.TrimSpace(msg.ReasoningContent); s != "" {
		if j := extractJSONObject(s); j != "" {
			return j, finish, nil
		}
	}

	return "", finish, nil
}

func isQwenModel(model string) bool {
	return strings.Contains(strings.ToLower(model), "qwen")
}

func unwrapMarkdownFence(s string) string {
	if m := fenceRE.FindStringSubmatch(strings.TrimSpace(s)); len(m) == 2 {
		return strings.TrimSpace(m[1])
	}
	return s
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
