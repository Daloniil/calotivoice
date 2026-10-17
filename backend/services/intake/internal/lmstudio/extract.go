package lmstudio

import "strings"

// extractJSONObject находит первый сбалансированный {...} с ключом "items".
func extractJSONObject(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "{") {
		if j := balancedJSONObject(s); j != "" {
			return j
		}
	}
	// Ищем в тексте (reasoning_content и т.п.)
	search := s
	for {
		i := strings.Index(search, "{")
		if i < 0 {
			break
		}
		if j := balancedJSONObject(search[i:]); j != "" && strings.Contains(j, `"items"`) {
			return j
		}
		if len(search) <= i+1 {
			break
		}
		search = search[i+1:]
	}
	return ""
}

func balancedJSONObject(s string) string {
	if len(s) == 0 || s[0] != '{' {
		return ""
	}
	depth := 0
	inStr := false
	esc := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		if inStr {
			if esc {
				esc = false
				continue
			}
			if c == '\\' {
				esc = true
				continue
			}
			if c == '"' {
				inStr = false
			}
			continue
		}
		switch c {
		case '"':
			inStr = true
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return s[:i+1]
			}
		}
	}
	return ""
}
