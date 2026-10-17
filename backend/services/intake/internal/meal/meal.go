package meal

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Response — контракт GET /v1/intake/{id} при status=done (поле data).
type Response struct {
	Items         []Item `json:"items"`
	Summary       string `json:"summary,omitempty"`
	RawTranscript string `json:"raw_transcript"`
}

type Item struct {
	Name         string  `json:"name"`
	Portion      string  `json:"portion,omitempty"`
	CaloriesKcal float64 `json:"calories_kcal"`
}

// Normalize проверяет и дополняет ответ модели.
func Normalize(transcript string, raw json.RawMessage) (json.RawMessage, error) {
	var in struct {
		Items []struct {
			Name         string  `json:"name"`
			Portion      string  `json:"portion"`
			CaloriesKcal float64 `json:"calories_kcal"`
		} `json:"items"`
		Summary       string `json:"summary"`
		RawTranscript string `json:"raw_transcript"`
	}
	if err := json.Unmarshal(raw, &in); err != nil {
		return nil, fmt.Errorf("invalid json: %w", err)
	}
	if len(in.Items) == 0 {
		return nil, fmt.Errorf("items array is empty")
	}

	out := Response{
		Summary:       strings.TrimSpace(in.Summary),
		RawTranscript: strings.TrimSpace(in.RawTranscript),
	}
	if out.RawTranscript == "" {
		out.RawTranscript = strings.TrimSpace(transcript)
	}

	for _, it := range in.Items {
		name := strings.TrimSpace(it.Name)
		if name == "" {
			continue
		}
		out.Items = append(out.Items, Item{
			Name:         name,
			Portion:      strings.TrimSpace(it.Portion),
			CaloriesKcal: it.CaloriesKcal,
		})
	}
	if len(out.Items) == 0 {
		return nil, fmt.Errorf("no valid items")
	}

	return json.Marshal(out)
}
