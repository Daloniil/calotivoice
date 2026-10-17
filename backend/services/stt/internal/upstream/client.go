package upstream

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// Transcript matches the JSON contract of the transcription upstream (local worker or cloud API adapter).
type Transcript struct {
	Text                string   `json:"text"`
	Language            string   `json:"language"`
	LanguageProbability float64  `json:"language_probability"`
	DurationSec         *float64 `json:"duration_sec"`
	Model               string   `json:"model"`
}

// Client forwards audio to STT_UPSTREAM_URL. The Go API does not care whether upstream is local Whisper or OpenAI.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Minute,
		},
	}
}

func (c *Client) Transcribe(ctx context.Context, filename string, audio io.Reader) (Transcript, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("audio", filename)
	if err != nil {
		return Transcript{}, err
	}
	if _, err := io.Copy(part, audio); err != nil {
		return Transcript{}, err
	}
	if err := w.Close(); err != nil {
		return Transcript{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/transcribe", &body)
	if err != nil {
		return Transcript{}, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	res, err := c.httpClient.Do(req)
	if err != nil {
		return Transcript{}, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return Transcript{}, fmt.Errorf("transcription upstream: %s: %s", res.Status, string(raw))
	}

	var out Transcript
	if err := json.Unmarshal(raw, &out); err != nil {
		return Transcript{}, err
	}
	return out, nil
}

func (c *Client) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return err
	}
	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("transcription upstream health: %s", res.Status)
	}
	return nil
}
