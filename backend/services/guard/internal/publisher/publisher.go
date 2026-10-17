package publisher

import (
	"context"

	"github.com/calorivoice/guard/internal/config"
	"github.com/calorivoice/guard/internal/events"
)

type ApprovedPublisher interface {
	PublishApproved(ctx context.Context, msg events.ApprovedTranscript) error
}

func NewFromConfig(cfg config.Config) ApprovedPublisher {
	return NewSQS(cfg.AWSRegion, cfg.SQSApprovedQueueURL)
}
