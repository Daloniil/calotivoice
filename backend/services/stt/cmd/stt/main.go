package main

import (
	"log"
	"net/http"
	"time"

	"github.com/calorivoice/stt/internal/config"
	"github.com/calorivoice/stt/internal/httpapi"
	"github.com/calorivoice/stt/internal/publisher"
	"github.com/calorivoice/stt/internal/upstream"
)

func main() {
	cfg := config.Load()
	client := upstream.NewClient(cfg.UpstreamURL)
	pub := publisher.NewFromConfig(cfg)
	srv := httpapi.New(cfg, client, pub)

	log.Printf("CaloriVoice STT API %s → whisper %s, pipeline guard=%s intake=%s",
		cfg.Addr, cfg.UpstreamURL, cfg.GuardURL, cfg.IntakeURL)
	httpSrv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 30 * time.Second,
		ReadTimeout:       5 * time.Minute,
		WriteTimeout:      cfg.PipelineTimeout + 2*time.Minute,
	}
	if err := httpSrv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
