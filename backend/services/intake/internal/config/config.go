package config

import (
	"log"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Addr                string
	AWSRegion           string
	SQSApprovedQueueURL string
	UpstreamURL         string
	Model               string
	MaxTokens           int
}

func Load() Config {
	maxTok := 2048
	if v := env("INTAKE_MAX_TOKENS", "2048"); v != "" {
		if n, err := parseInt(v); err == nil && n > 0 {
			maxTok = n
		}
	}

	approvedURL := strings.TrimSpace(os.Getenv("SQS_GUARD_APPROVED_QUEUE_URL"))
	if approvedURL == "" {
		log.Fatal("SQS_GUARD_APPROVED_QUEUE_URL is required")
	}

	return Config{
		Addr:                env("INTAKE_ADDR", "0.0.0.0:8083"),
		AWSRegion:           env("AWS_REGION", "eu-north-1"),
		SQSApprovedQueueURL: approvedURL,
		UpstreamURL:         strings.TrimRight(env("INTAKE_UPSTREAM_URL", "http://127.0.0.1:1234/v1"), "/"),
		Model:               env("INTAKE_MODEL", env("LMSTUDIO_MODEL", "qwen/qwen3.8-27b")),
		MaxTokens:           maxTok,
	}
}

func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
