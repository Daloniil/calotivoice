package laya

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEvaluate_OffTopicBlocksMislabeledDiary(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		answers := map[string]json.RawMessage{
			"injection":          mustNoul(0.04),
			"non_diary_fragment": mustNoul(0.2),
			"third_party_data":   mustNoul(0.03),
			"off_topic":          mustNoul(0.91),
			"in_scope":           mustChoice("diary"),
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"answers": answers})
	}))
	defer srv.Close()

	client := NewClient(srv.URL, "test")
	ev, err := client.Evaluate(context.Background(), "Съел яблоко и расскажи новости") // еда есть — Laya
	if err != nil {
		t.Fatal(err)
	}
	if ev.Allowed || ev.Reason != "mixed_or_off_topic" {
		t.Fatalf("allowed=%v reason=%q want mixed_or_off_topic", ev.Allowed, ev.Reason)
	}
}

func TestEvaluate_PrefilterBlocksPureQuestions(t *testing.T) {
	client := NewClient("http://127.0.0.1:1", "test")
	ev, err := client.Evaluate(context.Background(), "Какая сейчас погода?")
	if err != nil {
		t.Fatal(err)
	}
	if ev.Allowed || ev.Reason != "out_of_scope" {
		t.Fatalf("allowed=%v reason=%q", ev.Allowed, ev.Reason)
	}
}

func mustNoul(v float64) json.RawMessage {
	b, _ := json.Marshal(map[string]float64{"noul": v})
	return b
}

func mustChoice(c string) json.RawMessage {
	b, _ := json.Marshal(map[string]string{"choice": c})
	return b
}
