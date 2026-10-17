package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/calorivoice/foods/internal/config"
	"github.com/calorivoice/foods/internal/httpapi"
	"github.com/calorivoice/foods/internal/off"
)

func main() {
	cfg := config.Load()
	offClient, err := off.NewClient(cfg.UserAgent, cfg.HTTPTimeout)
	if err != nil {
		log.Fatalf("foods off client: %v", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	srv := httpapi.New(offClient)
	log.Printf("Foods API %s (Open Food Facts proxy; mobile-only)", cfg.Addr)

	httpSrv := &http.Server{Addr: cfg.Addr, Handler: srv.Handler()}
	go func() {
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	log.Println("foods shutting down")
	_ = httpSrv.Shutdown(context.Background())
	os.Exit(0)
}
