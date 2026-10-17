package pipeline

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type GuardResult struct {
	CheckID      string  `json:"check_id"`
	Status       string  `json:"status"`
	Allowed      bool    `json:"allowed"`
	IntakeQueued bool    `json:"intake_queued,omitempty"`
	Reason       string  `json:"reason,omitempty"`
	InScope      string  `json:"in_scope,omitempty"`
	OffTopicScore float64 `json:"off_topic_score,omitempty"`
}

type IntakeResult struct {
	CheckID string          `json:"check_id"`
	Status  string          `json:"status"`
	Data    json.RawMessage `json:"data,omitempty"`
	Error   string          `json:"error,omitempty"`
}

type Outcome struct {
	Guard  *GuardResult  `json:"guard,omitempty"`
	Intake *IntakeResult `json:"intake,omitempty"`
}

type Waiter struct {
	guardBase  string
	intakeBase string
	http       *http.Client
	interval   time.Duration
	timeout    time.Duration
}

func NewWaiter(guardBase, intakeBase string, timeout time.Duration) *Waiter {
	if timeout <= 0 {
		timeout = 3 * time.Minute
	}
	return &Waiter{
		guardBase:  trim(guardBase),
		intakeBase: trim(intakeBase),
		http:       &http.Client{Timeout: 30 * time.Second},
		interval:   400 * time.Millisecond,
		timeout:    timeout,
	}
}

func (w *Waiter) Wait(ctx context.Context, checkID string) (Outcome, error) {
	deadline, ok := ctx.Deadline()
	if !ok {
		deadline = time.Now().Add(w.timeout)
		ctx, _ = context.WithDeadline(ctx, deadline)
	}

	guard, err := w.waitGuard(ctx, checkID)
	if err != nil {
		return Outcome{}, err
	}
	out := Outcome{Guard: guard}
	if !guard.Allowed || !guard.IntakeQueued {
		return out, nil
	}

	intake, err := w.waitIntake(ctx, checkID)
	if err != nil {
		return out, err
	}
	out.Intake = intake
	return out, nil
}

func (w *Waiter) waitGuard(ctx context.Context, checkID string) (*GuardResult, error) {
	url := w.guardBase + "/v1/check/" + checkID
	for {
		if err := ctx.Err(); err != nil {
			return nil, fmt.Errorf("guard wait: %w", err)
		}
		res, err := w.getJSON(ctx, url)
		if err != nil {
			return nil, err
		}
		if res == nil {
			sleep(ctx, w.interval)
			continue
		}
		var g GuardResult
		if err := json.Unmarshal(res, &g); err != nil {
			return nil, err
		}
		if g.Status == "done" || g.Status == "error" {
			return &g, nil
		}
		sleep(ctx, w.interval)
	}
}

func (w *Waiter) waitIntake(ctx context.Context, checkID string) (*IntakeResult, error) {
	url := w.intakeBase + "/v1/intake/" + checkID
	interval := 500 * time.Millisecond
	for {
		if err := ctx.Err(); err != nil {
			return nil, fmt.Errorf("intake wait: %w", err)
		}
		res, err := w.getJSON(ctx, url)
		if err != nil {
			return nil, err
		}
		if res == nil {
			sleep(ctx, interval)
			continue
		}
		var in IntakeResult
		if err := json.Unmarshal(res, &in); err != nil {
			return nil, err
		}
		if in.Status == "done" || in.Status == "error" {
			return &in, nil
		}
		sleep(ctx, interval)
	}
}

func (w *Waiter) getJSON(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	res, err := w.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusNotFound {
		return nil, nil
	}
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pipeline GET %s: %s", url, res.Status)
	}
	var raw json.RawMessage
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func sleep(ctx context.Context, d time.Duration) {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
	case <-t.C:
	}
}

func trim(s string) string {
	for len(s) > 0 && s[len(s)-1] == '/' {
		s = s[:len(s)-1]
	}
	return s
}
