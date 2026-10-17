package config

import "os"

type Config struct {
	Addr        string
	UserAgent   string
	HTTPTimeout string
}

func Load() Config {
	return Config{
		Addr:        env("FOODS_ADDR", "0.0.0.0:8084"),
		UserAgent:   env("FOODS_USER_AGENT", "CaloriVoice/1.0 (foods; contact@calorivoice.app)"),
		HTTPTimeout: env("FOODS_HTTP_TIMEOUT", "20s"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
