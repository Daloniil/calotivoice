package events

// TranscriptPublished is sent by STT after successful transcription.
type TranscriptPublished struct {
	CheckID  string `json:"check_id"`
	Text     string `json:"text"`
	Language string `json:"language,omitempty"`
}

// ApprovedTranscript is sent to intake after guard allows the message.
type ApprovedTranscript struct {
	CheckID  string `json:"check_id"`
	Text     string `json:"text"`
	Language string `json:"language,omitempty"`
}

// CheckResult is stored and returned to the app.
type CheckResult struct {
	CheckID        string  `json:"check_id"`
	Status         string  `json:"status"` // pending | done | error
	Allowed        bool    `json:"allowed"`
	IntakeQueued   bool    `json:"intake_queued,omitempty"`
	InjectionScore float64 `json:"injection_score,omitempty"`
	OffTopicScore  float64 `json:"off_topic_score,omitempty"`
	InScope        string  `json:"in_scope,omitempty"`
	Reason         string  `json:"reason,omitempty"`
}
