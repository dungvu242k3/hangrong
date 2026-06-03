package game

import (
	"database/sql"
	"errors"
)

type PlayerService struct {
	db *sql.DB
}

func NewPlayerService(db *sql.DB) *PlayerService {
	return &PlayerService{db: db}
}

func (s *PlayerService) Profile(userID string) (UserProfile, error) {
	var profile UserProfile
	err := s.db.QueryRow(`
		SELECT u.id, u.username, u.email, w.coins, w.gems, u.level, u.current_xp, u.max_xp, st.level
		FROM users u
		JOIN user_wallets w ON u.id = w.user_id
		JOIN stalls st ON u.id = st.user_id
		WHERE u.id = $1
	`, userID).Scan(
		&profile.ID,
		&profile.Username,
		&profile.Email,
		&profile.Coins,
		&profile.Gems,
		&profile.Level,
		&profile.CurrentXP,
		&profile.MaxXP,
		&profile.StallLevel,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return UserProfile{}, ErrNotFound
		}
		return UserProfile{}, err
	}
	return profile, nil
}

