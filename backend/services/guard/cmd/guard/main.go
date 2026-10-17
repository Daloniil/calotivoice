package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/calorivoice/guard/internal/config"
	"github.com/calorivoice/guard/internal/httpapi"
	"github.com/calorivoice/guard/internal/laya"
	"github.com/calorivoice/guard/internal/publisher"
	"github.com/calorivoice/guard/internal/store"
	"github.com/calorivoice/guard/internal/worker"
)

func main() {
	cfg := config.Load()
	layaClient := laya.NewClient(cfg.UpstreamURL, cfg.LayaModel)
	st := store.New()
	pub := publisher.NewFromConfig(cfg)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	go func() {
		w := worker.New(cfg, layaClient, st, pub)
		if err := w.Run(ctx); err != nil && ctx.Err() == nil {
			log.Fatalf("sqs worker: %v", err)
		}
	}()

	srv := httpapi.New(cfg, layaClient, st)
	log.Printf("Guard API %s (laya %s, sqs transcript)", cfg.Addr, cfg.UpstreamURL)

	go func() {
		if err := http.ListenAndServe(cfg.Addr, srv.Handler()); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	log.Println("guard shutting down")
	os.Exit(0)
}
