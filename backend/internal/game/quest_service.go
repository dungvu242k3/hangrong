package game

import "slices"

type QuestService struct {
	store *Store
}

func NewQuestService(store *Store) *QuestService {
	return &QuestService{store: store}
}

func (s *QuestService) List(userID string) ([]Quest, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return nil, err
	}

	out := make([]Quest, 0, len(user.Quests))
	for _, quest := range user.Quests {
		out = append(out, questDTO(quest))
	}
	slices.SortFunc(out, func(a, b Quest) int {
		if a.ID < b.ID {
			return -1
		}
		if a.ID > b.ID {
			return 1
		}
		return 0
	})
	return out, nil
}

func (s *QuestService) Claim(userID, questID string) (int64, int64, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return 0, 0, err
	}
	quest, ok := user.Quests[questID]
	if !ok {
		return 0, 0, ErrNotFound
	}
	if quest.Claimed {
		return 0, 0, ErrConflict
	}
	if quest.CurrentCount < quest.TargetCount {
		return 0, 0, ErrNotReady
	}

	quest.Claimed = true
	user.Coins += quest.RewardCoins
	user.Gems += quest.RewardGems
	return quest.RewardCoins, quest.RewardGems, nil
}
