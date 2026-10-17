package worker

import (
	"context"
	"encoding/json"
	"log"

	"github.com/calorivoice/guard/internal/config"
	"github.com/calorivoice/guard/internal/events"
	"github.com/calorivoice/guard/internal/laya"
	"github.com/calorivoice/guard/internal/publisher"
	"github.com/calorivoice/guard/internal/store"
)

type Worker struct {
	cfg       config.Config
	laya      *laya.Client
	store     *store.Store
	publisher publisher.ApprovedPublisher
}

func New(cfg config.Config, client *laya.Client, st *store.Store, pub publisher.ApprovedPublisher) *Worker {
	return &Worker{cfg: cfg, laya: client, store: st, publisher: pub}
}

func (w *Worker) Run(ctx context.Context) error {
	return w.runSQS(ctx)
}

func (w *Worker) handle(ctx context.Context, body []byte) {
	var msg events.TranscriptPublished
	if err := json.Unmarshal(body, &msg); err != nil {
		log.Printf("guard: bad message: %v", err)
		return
	}
	if msg.CheckID == "" {
		return
	}

	w.store.Pending(msg.CheckID)

	ev, err := w.laya.Evaluate(ctx, msg.Text)
	if err != nil {
		log.Printf("guard: laya check %s: %v", msg.CheckID, err)
		w.store.Put(events.CheckResult{
			CheckID: msg.CheckID,
			Status:  "error",
			Allowed: false,
			Reason:  "laya_error",
		})
		return
	}

	result := events.CheckResult{
		CheckID:        msg.CheckID,
		Status:         "done",
		Allowed:        ev.Allowed,
		InjectionScore: ev.InjectionScore,
		OffTopicScore:  ev.OffTopicScore,
		InScope:        ev.InScope,
		Reason:         ev.Reason,
	}

	if ev.Allowed {
		approved := events.ApprovedTranscript{
			CheckID:  msg.CheckID,
			Text:     msg.Text,
			Language: msg.Language,
		}
		if err := w.publisher.PublishApproved(ctx, approved); err != nil {
			log.Printf("guard: publish approved %s: %v", msg.CheckID, err)
		} else {
			result.IntakeQueued = true
			log.Printf("guard: queued intake %s", msg.CheckID)
		}
	}

	w.store.Put(result)
}
