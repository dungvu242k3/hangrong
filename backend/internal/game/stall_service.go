package game

import (
	"database/sql"
	"errors"
)

type StallService struct {
	db *sql.DB
}

func NewStallService(db *sql.DB) *StallService {
	return &StallService{db: db}
}

func (s *StallService) Upgrade(userID string) (int, int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback()

	// 1. Get stall details
	var stall struct {
		ID    string
		Level int
	}
	err = tx.QueryRow("SELECT id, level FROM stalls WHERE user_id = $1 FOR UPDATE", userID).Scan(&stall.ID, &stall.Level)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	nextLevel := stall.Level + 1

	// 2. Get cost from upgrade_configs
	var costCoins int64
	err = tx.QueryRow(`
		SELECT cost_coins FROM upgrade_configs
		WHERE upgrade_type = 'stall' AND target_level = $1 AND is_active = TRUE
	`, nextLevel).Scan(&costCoins)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, ErrForbidden // Max level reached or config not found
		}
		return 0, 0, err
	}

	// 3. Get user wallet balance
	var coins int64
	err = tx.QueryRow("SELECT coins FROM user_wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&coins)
	if err != nil {
		return 0, 0, err
	}

	if coins < costCoins {
		return 0, 0, ErrInsufficientCoins
	}

	// 4. Deduct coins
	_, err = tx.Exec("UPDATE user_wallets SET coins = coins - $1 WHERE user_id = $2", costCoins, userID)
	if err != nil {
		return 0, 0, err
	}

	// 5. Update stall level
	_, err = tx.Exec("UPDATE stalls SET level = $1 WHERE id = $2", nextLevel, stall.ID)
	if err != nil {
		return 0, 0, err
	}

	// 6. Update user level (ensure user level is at least stall level)
	_, err = tx.Exec("UPDATE users SET level = GREATEST(level, $1) WHERE id = $2", nextLevel, userID)
	if err != nil {
		return 0, 0, err
	}

	// 7. Insert the new slot (index is nextLevel + 2)
	newSlotIndex := nextLevel + 2
	_, err = tx.Exec(`
		INSERT INTO stall_slots (stall_id, slot_index, status)
		VALUES ($1, $2, 'empty')
		ON CONFLICT (stall_id, slot_index) DO NOTHING
	`, stall.ID, newSlotIndex)
	if err != nil {
		return 0, 0, err
	}

	// 8. Update quest progress
	if err := updateQuestProgress(tx, userID, "UPGRADE_STALL", 1); err != nil {
		return 0, 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, err
	}

	return nextLevel, costCoins, nil
}

