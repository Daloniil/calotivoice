package laya

import (
	"context"
	"os"
	"testing"
)

// TestEvaluate_Scenarios_Laya — основной набор: реальный Laya + questions из guardQuestions().
func TestEvaluate_Scenarios_Laya(t *testing.T) {
	requireLayaUp(t)

	base := os.Getenv("LAYA_URL")
	if base == "" {
		base = "http://127.0.0.1:8092"
	}
	client := NewClient(base, "test")

	var ran int
	for _, sc := range loadScenarios(t) {
		if sc.GuardMockOnly {
			continue
		}
		ran++
		sc := sc
		t.Run(sc.ID, func(t *testing.T) {
			ev, err := client.Evaluate(context.Background(), sc.Text)
			if err != nil {
				t.Fatalf("laya: %v", err)
			}
			if ev.Allowed != sc.Expect.Allowed {
				t.Fatalf("allowed=%v want %v in_scope=%q reason=%q inj=%.2f off=%.2f text=%q",
					ev.Allowed, sc.Expect.Allowed, ev.InScope, ev.Reason,
					ev.InjectionScore, ev.OffTopicScore, sc.Text)
			}
		})
	}
	if ran == 0 {
		t.Fatal("no live scenarios in scenarios.json")
	}
}

func requireLayaUp(t *testing.T) {
	t.Helper()
	if os.Getenv("GUARD_SKIP_LAYA") == "1" {
		t.Skip("GUARD_SKIP_LAYA=1")
	}
	base := os.Getenv("LAYA_URL")
	if base == "" {
		base = "http://127.0.0.1:8092"
	}
	if err := NewClient(base, "test").Health(context.Background()); err != nil {
		t.Fatalf("Laya недоступна (%s): %v\nЗапусти: local-llms/laya/run.sh", base, err)
	}
}
