package worker

import (
	"context"
	"encoding/json"
	"log"

	"github.com/calorivoice/intake/internal/config"
	"github.com/calorivoice/intake/internal/events"
	"github.com/calorivoice/intake/internal/lmstudio"
	"github.com/calorivoice/intake/internal/meal"
	"github.com/calorivoice/intake/internal/store"
)

type Worker struct {
	cfg   config.Config
	lm    *lmstudio.Client
	store *store.Store
}

func New(cfg config.Config, lm *lmstudio.Client, st *store.Store) *Worker {
	return &Worker{cfg: cfg, lm: lm, store: st}
}

func (w *Worker) Run(ctx context.Context) error {
	return w.runSQS(ctx)
}

func (w *Worker) handle(ctx context.Context, body []byte) {
	var msg events.ApprovedTranscript
	if err := json.Unmarshal(body, &msg); err != nil {
		log.Printf("intake: bad message: %v", err)
		return
	}
	if msg.CheckID == "" || msg.Text == "" {
		return
	}

	w.store.Pending(msg.CheckID)
	log.Printf("intake: processing %s", msg.CheckID)

	raw, err := w.lm.ParseMealJSON(ctx, msg.Text)
	if err != nil {
		log.Printf("intake: lm %s: %v", msg.CheckID, err)
		w.store.Put(events.IntakeResult{
			CheckID: msg.CheckID,
			Status:  "error",
			Error:   "lm_error",
		})
		return
	}

	out, err := meal.Normalize(msg.Text, raw)
	if err != nil {
		log.Printf("intake: normalize %s: %v", msg.CheckID, err)
		w.store.Put(events.IntakeResult{
			CheckID: msg.CheckID,
			Status:  "error",
			Error:   "invalid_meal_json",
		})
		return
	}

	w.store.Put(events.IntakeResult{
		CheckID: msg.CheckID,
		Status:  "done",
		JSON:    out,
	})
	log.Printf("intake: done %s (%d bytes)", msg.CheckID, len(out))
}
