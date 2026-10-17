package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Addr                  string
	UpstreamURL           string
	GuardURL              string
	IntakeURL             string
	PipelineTimeout       time.Duration
	AWSRegion             string
	SQSTranscriptQueueURL string
	CORSOrigins           []string
}

func Load() Config {
	addr := env("STT_ADDR", "0.0.0.0:8080")
	upstream := strings.TrimRight(env("STT_UPSTREAM_URL", env("WHISPER_WORKER_URL", "http://127.0.0.1:8091")), "/")
	cors := env("STT_CORS_ORIGINS", "*")
	var origins []string
	for _, part := range strings.Split(cors, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			origins = append(origins, part)
		}
	}
	if len(origins) == 0 {
		origins = []string{"*"}
	}

	sqsURL := strings.TrimSpace(os.Getenv("SQS_STT_TRANSCRIPT_QUEUE_URL"))
	if sqsURL == "" {
		log.Fatal("SQS_STT_TRANSCRIPT_QUEUE_URL is required")
	}

	pipeSec := 180
	if v := env("STT_PIPELINE_TIMEOUT_SEC", "180"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			pipeSec = n
		}
	}

	return Config{
		Addr:                  addr,
		UpstreamURL:           upstream,
		GuardURL:              strings.TrimRight(env("STT_GUARD_URL", "http://127.0.0.1:8082"), "/"),
		IntakeURL:             strings.TrimRight(env("STT_INTAKE_URL", "http://127.0.0.1:8083"), "/"),
		PipelineTimeout:       time.Duration(pipeSec) * time.Second,
		AWSRegion:             env("AWS_REGION", "eu-north-1"),
		SQSTranscriptQueueURL: sqsURL,
		CORSOrigins:           origins,
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
