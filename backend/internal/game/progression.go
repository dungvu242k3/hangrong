package game

import (
	"database/sql"
	"time"
)

func updateQuestProgress(tx *sql.Tx, userID string, targetType string, increment int) error {
	// Find active user quests matching the targetType
	// Update progress and set to completed/claimed if they reach target_value
	rows, err := tx.Query(`
		SELECT uq.id, uq.progress, q.target_value
		FROM user_quests uq
		JOIN quests q ON uq.quest_id = q.id
		WHERE uq.user_id = $1 AND q.target_type = $2 AND uq.status = 'active'
		FOR UPDATE
	`, userID, targetType)
	if err != nil {
		return err
	}
	defer rows.Close()

	type questUpdate struct {
		id       string
		progress int
		status   string
	}
	var updates []questUpdate

	for rows.Next() {
		var uqID string
		var currentProgress, targetValue int
		if err := rows.Scan(&uqID, &currentProgress, &targetValue); err != nil {
			return err
		}
		newProgress := currentProgress + increment
		status := "active"
		var completedAt *time.Time
		if newProgress >= targetValue {
			newProgress = targetValue
			status = "completed"
			now := time.Now()
			completedAt = &now
		}

		updates = append(updates, questUpdate{id: uqID, progress: newProgress, status: status})
		_ = completedAt // will use in update query
	}

	for _, up := range updates {
		if up.status == "completed" {
			_, err = tx.Exec(`
				UPDATE user_quests
				SET progress = $1, status = $2, completed_at = now(), updated_at = now()
				WHERE id = $3
			`, up.progress, up.status, up.id)
		} else {
			_, err = tx.Exec(`
				UPDATE user_quests
				SET progress = $1, status = $2, updated_at = now()
				WHERE id = $3
			`, up.progress, up.status, up.id)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func addXP(tx *sql.Tx, userID string, xpGained int) (int, int64, int64, error) {
	var level int
	var currentXP, maxXP int64
	err := tx.QueryRow(`
		SELECT level, current_xp, max_xp
		FROM users
		WHERE id = $1
		FOR UPDATE
	`, userID).Scan(&level, &currentXP, &maxXP)
	if err != nil {
		return 0, 0, 0, err
	}

	currentXP += int64(xpGained)
	for currentXP >= maxXP {
		currentXP -= maxXP
		level++
		maxXP += int64(level) * 100
	}

	_, err = tx.Exec(`
		UPDATE users
		SET level = $1, current_xp = $2, max_xp = $3, updated_at = now()
		WHERE id = $4
	`, level, currentXP, maxXP, userID)
	if err != nil {
		return 0, 0, 0, err
	}

	return level, currentXP, maxXP, nil
}

func fastSellPrice(product Product) int64 {
	return product.SellPrice * 6 / 10
}

