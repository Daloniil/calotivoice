package events

type TranscriptPublished struct {
	CheckID  string `json:"check_id"`
	Text     string `json:"text"`
	Language string `json:"language,omitempty"`
}
