package game

import "fmt"

type StallService struct {
	store *Store
}

func NewStallService(store *Store) *StallService {
	return &StallService{store: store}
}

func (s *StallService) Upgrade(userID string) (int, int64, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return 0, 0, err
	}

	cost := int64(500 * user.StallLevel)
	if user.Coins < cost {
		return 0, 0, ErrInsufficientCoins
	}

	user.Coins -= cost
	user.StallLevel++
	user.Level = max(user.Level, user.StallLevel)
	slotID := fmt.Sprintf("slot-%d", len(user.Slots)+1)
	user.Slots[slotID] = &SlotState{ID: slotID}
	applyQuestProgress(user, "upgrade", 1)
	return user.StallLevel, cost, nil
}
