package laya

import "strings"

const (
	injectionStrict     = 0.55
	injectionMealOnly   = 0.78
	thirdPartyStrict    = 0.55
	thirdPartyWithMeal  = 0.82
	offTopicNoMeal      = 0.45
	offTopicWithAssist  = 0.38
	nonDiaryWithAssist  = 0.40
	mixedNonDiaryStrict = 0.72
)

func applyPolicy(text, inScope string, inj, nonDiary, thirdParty, offTopic float64) Evaluation {
	ev := Evaluation{
		Allowed:        true,
		InScope:        inScope,
		InjectionScore: inj,
		OffTopicScore:  offTopic,
	}
	lower := strings.ToLower(strings.TrimSpace(text))
	meal := mealLogSignal(lower)
	assist := assistantRequestSignal(lower)

	if injectionSignal(lower) {
		ev.Allowed = false
		ev.Reason = "injection"
		return ev
	}

	if meal && assist {
		ev.Allowed = false
		ev.Reason = "mixed_or_off_topic"
		return ev
	}

	if meal && !assist {
		return ev
	}

	// Нет явной еды — режем агрессивнее.
	if inj >= injectionStrict {
		ev.Allowed = false
		ev.Reason = "injection"
	}
	if ev.Allowed && thirdParty >= thirdPartyStrict {
		ev.Allowed = false
		ev.Reason = "third_party_data"
	}

	switch inScope {
	case "other":
		if ev.Allowed {
			ev.Allowed = false
			ev.Reason = "out_of_scope"
		}
	case "mixed":
		if ev.Allowed && nonDiary >= mixedNonDiaryStrict {
			ev.Allowed = false
			ev.Reason = "mixed_or_off_topic"
		}
	}

	if ev.Allowed && offTopic >= offTopicNoMeal {
		ev.Allowed = false
		ev.Reason = "off_topic"
	}
	if ev.Allowed && nonDiary >= nonDiaryWithAssist {
		ev.Allowed = false
		ev.Reason = "mixed_or_off_topic"
	}

	return ev
}
