package publisher

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"

	"github.com/calorivoice/stt/internal/events"
)

type sqsPublisher struct {
	client   *sqs.Client
	queueURL string
}

func NewSQS(region, queueURL string) TranscriptPublisher {
	cfg, err := awsconfig.LoadDefaultConfig(context.Background(), awsconfig.WithRegion(region))
	if err != nil {
		log.Fatalf("sqs config: %v", err)
	}
	return &sqsPublisher{
		client:   sqs.NewFromConfig(cfg),
		queueURL: queueURL,
	}
}

func (p *sqsPublisher) PublishTranscript(ctx context.Context, msg events.TranscriptPublished) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	_, err = p.client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(p.queueURL),
		MessageBody: aws.String(string(body)),
	})
	return err
}

func (p *sqsPublisher) PublishTranscriptAsync(msg events.TranscriptPublished) {
	go func() {
		if err := p.PublishTranscript(context.Background(), msg); err != nil {
			log.Printf("sqs publish: %v", err)
		}
	}()
}
