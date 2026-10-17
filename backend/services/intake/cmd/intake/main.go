package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/calorivoice/intake/internal/config"
	"github.com/calorivoice/intake/internal/httpapi"
	"github.com/calorivoice/intake/internal/lmstudio"
	"github.com/calorivoice/intake/internal/store"
	"github.com/calorivoice/intake/internal/worker"
)

func main() {
	cfg := config.Load()
	lm := lmstudio.NewClient(cfg.UpstreamURL, cfg.Model, cfg.MaxTokens)
	st := store.New()

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	go func() {
		w := worker.New(cfg, lm, st)
		if err := w.Run(ctx); err != nil && ctx.Err() == nil {
			log.Fatalf("intake worker: %v", err)
		}
	}()

	srv := httpapi.New(cfg, lm, st)
	log.Printf("Intake API %s (LM Studio %s model=%s, sqs approved)", cfg.Addr, cfg.UpstreamURL, cfg.Model)

	go func() {
		if err := http.ListenAndServe(cfg.Addr, srv.Handler()); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	log.Println("intake shutting down")
	os.Exit(0)
}
