package store

import (
	"sync"

	"github.com/calorivoice/intake/internal/events"
)

type Store struct {
	mu   sync.RWMutex
	byID map[string]events.IntakeResult
}

func New() *Store {
	return &Store{byID: make(map[string]events.IntakeResult)}
}

func (s *Store) Put(r events.IntakeResult) {
	s.mu.Lock()
	s.byID[r.CheckID] = r
	s.mu.Unlock()
}

func (s *Store) Get(id string) (events.IntakeResult, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.byID[id]
	return r, ok
}

func (s *Store) Pending(id string) {
	s.Put(events.IntakeResult{CheckID: id, Status: "pending"})
}
