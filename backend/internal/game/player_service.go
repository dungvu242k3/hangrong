package game

type PlayerService struct {
	store *Store
}

func NewPlayerService(store *Store) *PlayerService {
	return &PlayerService{store: store}
}

func (s *PlayerService) Profile(userID string) (UserProfile, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return UserProfile{}, err
	}
	return profileDTO(user), nil
}
