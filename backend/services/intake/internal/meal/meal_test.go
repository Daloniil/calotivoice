package meal

import (
	"encoding/json"
	"testing"
)

func TestNormalize_fillsRawTranscript(t *testing.T) {
	raw := json.RawMessage(`{"items":[{"name":"борщ","portion":"1","calories_kcal":300}],"summary":"ok"}`)
	out, err := Normalize("исходный текст", raw)
	if err != nil {
		t.Fatal(err)
	}
	var resp Response
	if err := json.Unmarshal(out, &resp); err != nil {
		t.Fatal(err)
	}
	if resp.RawTranscript != "исходный текст" {
		t.Fatalf("raw %q", resp.RawTranscript)
	}
	if len(resp.Items) != 1 || resp.Items[0].Name != "борщ" {
		t.Fatalf("%+v", resp)
	}
}
