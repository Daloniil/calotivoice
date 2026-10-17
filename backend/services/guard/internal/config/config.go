package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	Addr                  string
	UpstreamURL           string
	LayaModel             string
	AWSRegion             string
	SQSTranscriptQueueURL string
	SQSApprovedQueueURL   string
	CORSOrigins           []string
}

func Load() Config {
	cors := env("GUARD_CORS_ORIGINS", "*")
	var origins []string
	for _, part := range strings.Split(cors, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			origins = append(origins, part)
		}
	}

	transcriptURL := strings.TrimSpace(os.Getenv("SQS_STT_TRANSCRIPT_QUEUE_URL"))
	approvedURL := strings.TrimSpace(os.Getenv("SQS_GUARD_APPROVED_QUEUE_URL"))
	if transcriptURL == "" || approvedURL == "" {
		log.Fatal("SQS_STT_TRANSCRIPT_QUEUE_URL and SQS_GUARD_APPROVED_QUEUE_URL are required")
	}

	return Config{
		Addr:                  env("GUARD_ADDR", "0.0.0.0:8082"),
		UpstreamURL:           strings.TrimRight(env("GUARD_UPSTREAM_URL", "http://127.0.0.1:8092"), "/"),
		LayaModel:             env("GUARD_LAYA_MODEL", "laya-multilingual"),
		AWSRegion:             env("AWS_REGION", "eu-north-1"),
		SQSTranscriptQueueURL: transcriptURL,
		SQSApprovedQueueURL:   approvedURL,
		CORSOrigins:           origins,
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
