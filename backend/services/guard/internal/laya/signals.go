package laya

import "strings"

func mealLogSignal(lower string) bool {
	keywords := []string{
		"съел", "съела", "съели", "поел", "поела", "выпил", "выпила", "пил", "пила", "ел ", "ела ",
		"перекус", "завтрак", "обед", "ужин", "полдник", "калори", "ккал", "kcal", "calorie",
		"ate ", "eaten", "eating", "drank", "drink", "snack", "breakfast", "lunch", "dinner",
		"meal prep", "logged", "portion", "grams of", "грамм", "ml ", "мл ",
		"burger", "бургер", "бунгер", "pizza", "пицц", "суп", "салат", "кофе", "чай", "вино", "пиво",
		"water", "вода", "protein", "протеин", "had ", "i ate", "i had", "i drank",
		"поужинал", "залил", "кушал", "кушала", "перекусил",
		"каша", "котлета", "компот", "тост", "авокад", "яйц", "пашот", "cheese",
		"колбас", "сыр", "хлеб", "coffee", "black coffee", "wine", "glasses of",
		"на день:", "на пикнике",
	}
	for _, k := range keywords {
		if strings.Contains(lower, k) {
			return true
		}
	}
	return strings.Contains(lower, "kcal") || strings.Contains(lower, "ккал")
}

// assistantRequestSignal — просьба к ассистенту / off-topic, не запись еды.
func assistantRequestSignal(lower string) bool {
	markers := []string{
		"скажи ", "расскажи ", "напиши ", "подскажи ", "найди ", "реши ", "выдай ", "дай телефон",
		"дай пароль", "пришли ", "переведи ", "explain ", "tell me ", "give me ", "help me write",
		"what's the bitcoin", "what is the bitcoin", "bitcoin price", "курс битко", "курс доллара",
		"цена акци", "stock price", "system prompt", "hidden instructions", "jailbreak",
		"ignore all instructions", "disregard safety", "select * from", "аккаунт", "account details",
		"password", "пароль", "email всех", "сколько лет ", "how old is", "years old",
		"где живёт", "where does ", "live?", "диагноз", "disease does", "таблетки принимает",
		"погода", "weather", "анекдот про полит", "сплетни", "как починить", "recommend a movie",
		"trending on twitter", "quantum computing", "translate ", "set an alarm", "schedule a meeting",
		"convert 100", "capital of france", "who won the football", "who is the president",
		"напомни мне", "сказку на ночь", "где купить", "купить iphone",
	}
	for _, m := range markers {
		if strings.Contains(lower, m) {
			return true
		}
	}
	if strings.HasPrefix(lower, "сколько лет") {
		return true
	}
	return false
}

func injectionSignal(lower string) bool {
	markers := []string{
		"you are now dan", "jailbreak", "ignore all instructions", "disregard safety",
		"system prompt", "hidden instructions", "override guardrails", "dump database",
		"```system", "reveal secrets", "repeat your hidden",
	}
	for _, m := range markers {
		if strings.Contains(lower, m) {
			return true
		}
	}
	return false
}

func generalUserQuestion(lower string) bool {
	if strings.ContainsRune(lower, '?') {
		return true
	}
	prefixes := []string{
		"какая ", "какой ", "какие ", "как ", "скажи ", "расскажи ", "напиши ", "подскажи ",
		"what ", "who ", "where ", "when ", "why ", "how ", "tell me ", "recommend ",
		"convert ", "schedule ", "help me ", "explain ", "translate ", "set an ",
		"сколько лет", "сколько сейчас",
	}
	for _, p := range prefixes {
		if strings.HasPrefix(lower, p) || strings.Contains(lower, " "+p) {
			return true
		}
	}
	if strings.HasPrefix(lower, "сколько ") && !strings.Contains(lower, "калори") && !strings.Contains(lower, "ккал") {
		return true
	}
	return false
}
