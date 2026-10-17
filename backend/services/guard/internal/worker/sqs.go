package worker

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func (w *Worker) runSQS(ctx context.Context) error {
	cfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(w.cfg.AWSRegion))
	if err != nil {
		return err
	}
	client := sqs.NewFromConfig(cfg)
	queueURL := w.cfg.SQSTranscriptQueueURL

	log.Printf("guard worker listening on sqs %s", queueURL)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		out, err := client.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(queueURL),
			MaxNumberOfMessages: 1,
			WaitTimeSeconds:     20,
		})
		if err != nil {
			log.Printf("guard sqs receive: %v", err)
			continue
		}

		for _, m := range out.Messages {
			if m.Body == nil {
				continue
			}
			w.handle(ctx, []byte(*m.Body))
			if m.ReceiptHandle != nil {
				_, err := client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
					QueueUrl:      aws.String(queueURL),
					ReceiptHandle: m.ReceiptHandle,
				})
				if err != nil {
					log.Printf("guard sqs delete: %v", err)
				}
			}
		}
	}
}
