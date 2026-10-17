package laya

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL string
	model   string
	http    *http.Client
}

func NewClient(baseURL, model string) *Client {
	return &Client{
		baseURL: baseURL,
		model:   model,
		http:    &http.Client{Timeout: 2 * time.Minute},
	}
}

type Evaluation struct {
	InjectionScore float64
	OffTopicScore  float64
	InScope        string
	Allowed        bool
	Reason         string
}

func (c *Client) Evaluate(ctx context.Context, text string) (Evaluation, error) {
	text = strings.TrimSpace(text)
	if reason, block := prefilterBlock(text); block {
		return Evaluation{Allowed: false, Reason: reason}, nil
	}

	body := map[string]any{
		"model":     c.model,
		"state":     text,
		"questions": guardQuestions(),
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return Evaluation{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/systemone", bytes.NewReader(raw))
	if err != nil {
		return Evaluation{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return Evaluation{}, err
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return Evaluation{}, fmt.Errorf("laya: %s: %s", res.Status, string(respBody))
	}

	var parsed struct {
		Answers map[string]json.RawMessage `json:"answers"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return Evaluation{}, err
	}

	var inj, nonDiary, thirdParty, offTopic float64
	if rawNoul, ok := parsed.Answers["injection"]; ok {
		inj = readNoul(rawNoul)
	}
	if rawNoul, ok := parsed.Answers["non_diary_fragment"]; ok {
		nonDiary = readNoul(rawNoul)
	}
	if rawNoul, ok := parsed.Answers["third_party_data"]; ok {
		thirdParty = readNoul(rawNoul)
	}
	if rawNoul, ok := parsed.Answers["off_topic"]; ok {
		offTopic = readNoul(rawNoul)
	}
	inScope := ""
	if rawChoice, ok := parsed.Answers["in_scope"]; ok {
		inScope = readChoice(rawChoice)
	}

	return applyPolicy(text, inScope, inj, nonDiary, thirdParty, offTopic), nil
}

func readNoul(raw json.RawMessage) float64 {
	var noul struct {
		Noul float64 `json:"noul"`
	}
	_ = json.Unmarshal(raw, &noul)
	return noul.Noul
}

func readChoice(raw json.RawMessage) string {
	var choice struct {
		Choice string `json:"choice"`
	}
	_ = json.Unmarshal(raw, &choice)
	return choice.Choice
}

func (c *Client) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return err
	}
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("laya health: %s", res.Status)
	}
	return nil
}
