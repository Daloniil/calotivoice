package laya

import "strings"

func prefilterBlock(text string) (reason string, block bool) {
	t := strings.TrimSpace(text)
	if t == "" {
		return "out_of_scope", true
	}
	lower := strings.ToLower(t)
	if mealLogSignal(lower) {
		return "", false
	}
	if generalUserQuestion(lower) || assistantRequestSignal(lower) {
		return "out_of_scope", true
	}
	switch lower {
	case "привет", "hello", "hi", "hey":
		return "out_of_scope", true
	}
	return "", false
}
