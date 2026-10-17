package laya

import "testing"

func TestPrefilterBlock(t *testing.T) {
	cases := []struct {
		text  string
		block bool
	}{
		{"Какая сейчас погода?", true},
		{"What's the weather in Berlin?", true},
		{"Привет", true},
		{"Я съел два бургера и выпил бутылку вина.", false},
		{"И я выпил бутылку вина и съел два бунгера.", false},
		{"500 kcal", false},
		{"Пропустил обед, только вода.", false},
		{"На обед борщ и какая погода завтра?", false}, // еда + assist — не prefilter
	}
	for _, tc := range cases {
		_, block := prefilterBlock(tc.text)
		if block != tc.block {
			t.Fatalf("prefilter(%q) block=%v want %v", tc.text, block, tc.block)
		}
	}
}
