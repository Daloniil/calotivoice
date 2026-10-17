package publisher

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"

	"github.com/calorivoice/guard/internal/events"
)

type sqsPublisher struct {
	client   *sqs.Client
	queueURL string
}

func NewSQS(region, queueURL string) ApprovedPublisher {
	cfg, err := awsconfig.LoadDefaultConfig(context.Background(), awsconfig.WithRegion(region))
	if err != nil {
		log.Fatalf("sqs config: %v", err)
	}
	return &sqsPublisher{
		client:   sqs.NewFromConfig(cfg),
		queueURL: queueURL,
	}
}

func (p *sqsPublisher) PublishApproved(ctx context.Context, msg events.ApprovedTranscript) error {
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
