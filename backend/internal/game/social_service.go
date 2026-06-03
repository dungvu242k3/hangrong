package game

import "slices"

type SocialService struct {
	store *Store
}

func NewSocialService(store *Store) *SocialService {
	return &SocialService{store: store}
}

func (s *SocialService) Friends() []Friend {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	out := make([]Friend, len(s.store.friends))
	copy(out, s.store.friends)
	return out
}

func (s *SocialService) NeighborSlots(neighborID string) ([]StallSlot, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	if !slices.ContainsFunc(s.store.friends, func(friend Friend) bool { return friend.ID == neighborID }) {
		return nil, ErrNotFound
	}

	productID := "banh-mi"
	name := "Banh mi"
	icon := "sandwich"
	return []StallSlot{
		{ID: neighborID + "-slot-1", ProductID: &productID, ProductName: &name, ProductIcon: &icon, TimeRemaining: 0, TotalTime: 20, IsReadyToCollect: true, CoinsReward: 90},
		{ID: neighborID + "-slot-2", ProductID: nil, ProductName: nil, ProductIcon: nil, TimeRemaining: 0, TotalTime: 0, IsReadyToCollect: false, CoinsReward: 0},
	}, nil
}

func (s *SocialService) NeighborAction(userID, neighborID, action string) (int, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return 0, err
	}
	if !slices.ContainsFunc(s.store.friends, func(friend Friend) bool { return friend.ID == neighborID }) {
		return 0, ErrNotFound
	}

	gained := 10
	if action == "prank" {
		gained = 6
	}
	user.CurrentXP += gained
	recalculateLevel(user)
	return gained, nil
}
