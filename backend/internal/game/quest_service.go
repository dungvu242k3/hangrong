package game

import (
	"database/sql"
	"errors"
)

type QuestService struct {
	db *sql.DB
}

func NewQuestService(db *sql.DB) *QuestService {
	return &QuestService{db: db}
}

func (s *QuestService) List(userID string) ([]Quest, error) {
	rows, err := s.db.Query(`
		SELECT uq.id, q.title, q.description, q.target_value, uq.progress,
		       COALESCE((q.reward->>'coins')::bigint, 0),
		       COALESCE((q.reward->>'gems')::bigint, 0),
		       uq.status, q.quest_type
		FROM user_quests uq
		JOIN quests q ON uq.quest_id = q.id
		WHERE uq.user_id = $1
		ORDER BY q.code ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Quest
	for rows.Next() {
		var q Quest
		var status string
		err := rows.Scan(
			&q.ID,
			&q.Title,
			&q.Description,
			&q.TargetCount,
			&q.CurrentCount,
			&q.RewardCoins,
			&q.RewardGems,
			&status,
			&q.Type,
		)
		if err == nil {
			q.IsCompleted = q.CurrentCount >= q.TargetCount
			q.IsClaimed = status == "claimed"
			out = append(out, q)
		}
	}
	return out, nil
}

func (s *QuestService) Claim(userID, questID string) (int64, int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback()

	var uq struct {
		ID           string
		Progress     int
		TargetCount  int
		Status       string
		RewardCoins  int64
		RewardGems   int64
	}

	err = tx.QueryRow(`
		SELECT uq.id, uq.progress, q.target_value, uq.status,
		       COALESCE((q.reward->>'coins')::bigint, 0),
		       COALESCE((q.reward->>'gems')::bigint, 0)
		FROM user_quests uq
		JOIN quests q ON uq.quest_id = q.id
		WHERE uq.user_id = $1 AND uq.id = $2
		FOR UPDATE
	`, userID, questID).Scan(
		&uq.ID,
		&uq.Progress,
		&uq.TargetCount,
		&uq.Status,
		&uq.RewardCoins,
		&uq.RewardGems,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	if uq.Status == "claimed" {
		return 0, 0, ErrConflict
	}
	if uq.Progress < uq.TargetCount {
		return 0, 0, ErrNotReady
	}

	// Update quest status
	_, err = tx.Exec(`
		UPDATE user_quests
		SET status = 'claimed', claimed_at = now()
		WHERE id = $1
	`, uq.ID)
	if err != nil {
		return 0, 0, err
	}

	// Add rewards to wallet
	_, err = tx.Exec(`
		UPDATE user_wallets
		SET coins = coins + $1, gems = gems + $2
		WHERE user_id = $3
	`, uq.RewardCoins, uq.RewardGems, userID)
	if err != nil {
		return 0, 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, err
	}

	return uq.RewardCoins, uq.RewardGems, nil
}

