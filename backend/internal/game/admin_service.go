package game

import (
	"database/sql"
)

type AdminService struct {
	db *sql.DB
}

func NewAdminService(db *sql.DB) *AdminService {
	return &AdminService{db: db}
}

func (s *AdminService) ListPlayers() ([]AdminPlayer, error) {
	rows, err := s.db.Query(`
		SELECT u.id, u.username, u.display_name, u.level, uw.coins, uw.gems, u.created_at
		FROM users u
		JOIN user_wallets uw ON u.id = uw.user_id
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AdminPlayer
	for rows.Next() {
		var p AdminPlayer
		err := rows.Scan(
			&p.ID,
			&p.Username,
			&p.DisplayName,
			&p.Level,
			&p.Coins,
			&p.Gems,
			&p.CreatedAt,
		)
		if err == nil {
			out = append(out, p)
		}
	}
	return out, nil
}

func (s *AdminService) UpdatePlayer(id string, coins, gems int64, level int) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update user level
	res, err := tx.Exec(`
		UPDATE users
		SET level = $1
		WHERE id = $2
	`, level, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}

	// Update wallet coins and gems
	_, err = tx.Exec(`
		UPDATE user_wallets
		SET coins = $1, gems = $2
		WHERE user_id = $3
	`, coins, gems, id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *AdminService) DeletePlayer(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete admin_actions
	_, err = tx.Exec("DELETE FROM admin_actions WHERE admin_user_id = $1 OR target_user_id = $1", id)
	if err != nil {
		return err
	}

	// 2. Delete security_events
	_, err = tx.Exec("DELETE FROM security_events WHERE user_id = $1", id)
	if err != nil {
		return err
	}

	// 3. Delete shop_purchases
	_, err = tx.Exec("DELETE FROM shop_purchases WHERE user_id = $1", id)
	if err != nil {
		return err
	}

	// 4. Delete neighbor_actions
	_, err = tx.Exec("DELETE FROM neighbor_actions WHERE from_user_id = $1 OR to_user_id = $1", id)
	if err != nil {
		return err
	}

	// 5. Delete sales
	_, err = tx.Exec("DELETE FROM sales WHERE user_id = $1", id)
	if err != nil {
		return err
	}

	// 6. Delete currency_ledger
	_, err = tx.Exec("DELETE FROM currency_ledger WHERE user_id = $1", id)
	if err != nil {
		return err
	}

	// 7. Delete idempotency_keys
	_, err = tx.Exec("DELETE FROM idempotency_keys WHERE user_id = $1", id)
	if err != nil {
		return err
	}

	// 8. Delete user (This will cascade delete wallets, stalls, slots, inventory, etc.)
	res, err := tx.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}

	return tx.Commit()
}
