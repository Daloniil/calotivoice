package laya

import "testing"

func TestApplyPolicy_pureMealAllowsDespiteLayaNoise(t *testing.T) {
	ev := applyPolicy("Я съел два бургера и выпил вино", "diary", 0.11, 0.85, 0.76, 0.69)
	if !ev.Allowed {
		t.Fatalf("pure meal blocked: %q", ev.Reason)
	}
}

func TestApplyPolicy_mealPlusAssistBlocks(t *testing.T) {
	ev := applyPolicy("Съел салат и скажи, сколько лет Ане", "mixed", 0.04, 0.09, 0.09, 0.09)
	if ev.Allowed {
		t.Fatal("meal+assist should block")
	}
}

func TestApplyPolicy_noMealBlocksHighOffTopic(t *testing.T) {
	ev := applyPolicy("Explain quantum computing", "diary", 0.05, 0.2, 0.1, 0.50)
	if ev.Allowed {
		t.Fatal("expected block")
	}
}

func TestApplyPolicy_layaMislabelDiaryWithAssistScores(t *testing.T) {
	ev := applyPolicy("Съел яблоко", "diary", 0.04, 0.2, 0.03, 0.91)
	if !ev.Allowed {
		t.Fatalf("pure meal should allow despite off_topic=%v reason=%q", ev.OffTopicScore, ev.Reason)
	}
}
