package laya

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

type scenarioFile struct {
	Scenarios []guardScenario `json:"scenarios"`
}

type guardScenario struct {
	ID             string                     `json:"id"`
	Description    string                     `json:"description,omitempty"`
	Text           string                     `json:"text"`
	GuardMockOnly  bool                       `json:"guard_mock_only,omitempty"`
	Expect         expect                     `json:"expect"`
	MockAnswers    map[string]json.RawMessage `json:"mock_answers,omitempty"`
}

type expect struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason,omitempty"`
}

func scenariosJSON(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller")
	}
	path := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "testing", "scenarios.json"))
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("scenarios.json: %v", err)
	}
	return path
}

func loadScenarios(t *testing.T) []guardScenario {
	t.Helper()
	raw, err := os.ReadFile(scenariosJSON(t))
	if err != nil {
		t.Fatal(err)
	}
	var f scenarioFile
	if err := json.Unmarshal(raw, &f); err != nil {
		t.Fatal(err)
	}
	return f.Scenarios
}
