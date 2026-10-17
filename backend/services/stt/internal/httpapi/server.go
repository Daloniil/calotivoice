package httpapi

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"

	"github.com/calorivoice/stt/internal/config"
	"github.com/calorivoice/stt/internal/events"
	"github.com/calorivoice/stt/internal/pipeline"
	"github.com/calorivoice/stt/internal/publisher"
	"github.com/calorivoice/stt/internal/upstream"
)

type Server struct {
	cfg       config.Config
	upstream  *upstream.Client
	publisher publisher.TranscriptPublisher
	pipeline  *pipeline.Waiter
}

func New(cfg config.Config, client *upstream.Client, pub publisher.TranscriptPublisher) *Server {
	return &Server{
		cfg:       cfg,
		upstream:  client,
		publisher: pub,
		pipeline:  pipeline.NewWaiter(cfg.GuardURL, cfg.IntakeURL, cfg.PipelineTimeout),
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("POST /v1/transcribe", s.handleTranscribe)
	return s.withCORS(mux)
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allow := "*"
		if len(s.cfg.CORSOrigins) == 1 && s.cfg.CORSOrigins[0] != "*" {
			allow = s.cfg.CORSOrigins[0]
		} else if origin != "" {
			for _, o := range s.cfg.CORSOrigins {
				if o == "*" || o == origin {
					allow = origin
					if o == "*" {
						allow = "*"
					}
					break
				}
			}
		}
		w.Header().Set("Access-Control-Allow-Origin", allow)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := s.upstream.Health(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "degraded",
			"error":  err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleTranscribe(w http.ResponseWriter, r *http.Request) {
	const maxBody = 32 << 20 // 32 MiB
	r.Body = http.MaxBytesReader(w, r.Body, maxBody)

	if err := r.ParseMultipartForm(maxBody); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid multipart body"})
		return
	}

	file, header, err := r.FormFile("audio")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing form field \"audio\""})
		return
	}
	defer file.Close()

	filename := "recording.m4a"
	if header != nil && header.Filename != "" {
		filename = header.Filename
	}

	out, err := s.upstream.Transcribe(r.Context(), filename, file)
	if err != nil {
		log.Printf("transcribe: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "transcription failed"})
		return
	}

	checkID := uuid.NewString()
	msg := events.TranscriptPublished{
		CheckID:  checkID,
		Text:     out.Text,
		Language: out.Language,
	}
	if err := s.publisher.PublishTranscript(r.Context(), msg); err != nil {
		log.Printf("transcribe: sqs publish: %v", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "pipeline unavailable"})
		return
	}

	pipeCtx, cancel := context.WithTimeout(r.Context(), s.cfg.PipelineTimeout)
	defer cancel()
	outcome, err := s.pipeline.Wait(pipeCtx, checkID)
	if err != nil {
		log.Printf("transcribe: pipeline %s: %v", checkID, err)
		writeJSON(w, http.StatusGatewayTimeout, map[string]any{
			"error":     "pipeline timeout",
			"text":      out.Text,
			"check_id":  checkID,
			"language":  out.Language,
		})
		return
	}

	resp := map[string]any{
		"text":                 out.Text,
		"language":             out.Language,
		"language_probability": out.LanguageProbability,
		"duration_sec":         out.DurationSec,
		"model":                out.Model,
		"check_id":             checkID,
	}
	if outcome.Guard != nil {
		resp["guard"] = outcome.Guard
	}
	if outcome.Intake != nil {
		resp["intake"] = outcome.Intake
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}
