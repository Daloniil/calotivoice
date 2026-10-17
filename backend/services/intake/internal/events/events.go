package events

import "encoding/json"

type ApprovedTranscript struct {
	CheckID  string `json:"check_id"`
	Text     string `json:"text"`
	Language string `json:"language,omitempty"`
}

type IntakeResult struct {
	CheckID string          `json:"check_id"`
	Status  string          `json:"status"` // pending | done | error
	JSON    json.RawMessage `json:"data,omitempty"`
	Error   string          `json:"error,omitempty"`
}
