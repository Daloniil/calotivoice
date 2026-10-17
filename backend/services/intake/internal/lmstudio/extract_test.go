package lmstudio

import "testing"

func TestExtractJSONObject_balanced(t *testing.T) {
	raw := `noise {"items":[{"name":"wine","calories_kcal":600}],"summary":"x","raw_transcript":"y"} tail`
	got := extractJSONObject(raw)
	if got == "" || !contains(got, `"items"`) {
		t.Fatalf("got %q", got)
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
