package publisher

import (
	"context"

	"github.com/calorivoice/stt/internal/config"
	"github.com/calorivoice/stt/internal/events"
)

type TranscriptPublisher interface {
	PublishTranscript(ctx context.Context, msg events.TranscriptPublished) error
	PublishTranscriptAsync(msg events.TranscriptPublished)
}

func NewFromConfig(cfg config.Config) TranscriptPublisher {
	return NewSQS(cfg.AWSRegion, cfg.SQSTranscriptQueueURL)
}
