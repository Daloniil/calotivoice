package store

import (
	"sync"

	"github.com/calorivoice/guard/internal/events"
)

type Store struct {
	mu   sync.RWMutex
	byID map[string]events.CheckResult
}

func New() *Store {
	return &Store{byID: make(map[string]events.CheckResult)}
}

func (s *Store) Put(r events.CheckResult) {
	s.mu.Lock()
	s.byID[r.CheckID] = r
	s.mu.Unlock()
}

func (s *Store) Get(id string) (events.CheckResult, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.byID[id]
	return r, ok
}

func (s *Store) Pending(id string) {
	s.Put(events.CheckResult{CheckID: id, Status: "pending", Allowed: false})
}
