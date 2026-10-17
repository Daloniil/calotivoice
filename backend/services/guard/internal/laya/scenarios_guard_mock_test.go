package laya

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestEvaluate_GuardLogic_Mock — симулированные ответы Laya для текстов «еда + команда».
func TestEvaluate_GuardLogic_Mock(t *testing.T) {
	cases := []struct {
		name    string
		text    string
		answers map[string]json.RawMessage
		reason  string
	}{
		{
			name: "laya_underscores_mixed",
			text: "Had a burger and what's the bitcoin price?",
			answers: map[string]json.RawMessage{
				"injection": mustNoul(0.2), "non_diary_fragment": mustNoul(0.18),
				"third_party_data": mustNoul(0.1), "off_topic": mustNoul(0.18),
				"in_scope": mustChoice("diary"),
			},
			reason: "mixed_or_off_topic",
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_ = json.NewEncoder(w).Encode(map[string]any{"answers": tc.answers})
			}))
			defer srv.Close()

			ev, err := NewClient(srv.URL, "test").Evaluate(context.Background(), tc.text)
			if err != nil {
				t.Fatal(err)
			}
			if ev.Allowed {
				t.Fatalf("expected block text=%q", tc.text)
			}
			if ev.Reason != tc.reason {
				t.Fatalf("reason=%q want %q", ev.Reason, tc.reason)
			}
		})
	}
}
