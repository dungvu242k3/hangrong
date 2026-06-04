package game

import (
	"database/sql"
	"errors"
	"time"
)

type ImportOrderService struct {
	db *sql.DB
}

func NewImportOrderService(db *sql.DB) *ImportOrderService {
	return &ImportOrderService{db: db}
}

func (s *ImportOrderService) ActiveOrders(userID string) ([]ImportOrder, error) {
	now := time.Now()
	rows, err := s.db.Query(`
		SELECT o.id, o.product_id, p.name, o.quantity, o.started_at, o.completed_at, o.status
		FROM import_orders o
		JOIN products p ON o.product_id = p.id
		WHERE o.user_id = $1 AND o.status = 'pending'
		ORDER BY o.completed_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []ImportOrder
	for rows.Next() {
		var o struct {
			ID          string
			ProductID   string
			ProductName string
			Quantity    int
			StartedAt   time.Time
			CompletedAt time.Time
			Status      string
		}
		if err := rows.Scan(&o.ID, &o.ProductID, &o.ProductName, &o.Quantity, &o.StartedAt, &o.CompletedAt, &o.Status); err != nil {
			return nil, err
		}

		timeRemaining := max(0, int(o.CompletedAt.Sub(now).Seconds()))
		totalTime := max(1, int(o.CompletedAt.Sub(o.StartedAt).Seconds()))
		computedStatus := o.Status
		if o.Status == "pending" && !now.Before(o.CompletedAt) {
			computedStatus = "completed"
		}

		out = append(out, ImportOrder{
			ID:            o.ID,
			ProductID:     o.ProductID,
			Name:          o.ProductName,
			Quantity:      o.Quantity,
			TimeRemaining: timeRemaining,
			TotalTime:     totalTime,
			Status:        computedStatus,
		})
	}
	return out, nil
}

func (s *ImportOrderService) Create(userID, productID string, quantity int) (ImportOrder, int64, error) {
	if quantity <= 0 || quantity > 100 {
		return ImportOrder{}, 0, ErrInvalidInput
	}

	tx, err := s.db.Begin()
	if err != nil {
		return ImportOrder{}, 0, err
	}
	defer tx.Rollback()

	// Get product details
	var p struct {
		ID                    string
		Name                  string
		LevelRequired         int
		ImportPrice           int64
		ImportDurationSeconds int
	}
	err = tx.QueryRow(`
		SELECT id, name, unlock_level, import_price, import_duration_seconds
		FROM products
		WHERE id = $1 AND is_active = TRUE
	`, productID).Scan(&p.ID, &p.Name, &p.LevelRequired, &p.ImportPrice, &p.ImportDurationSeconds)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ImportOrder{}, 0, ErrNotFound
		}
		return ImportOrder{}, 0, err
	}

	// Get user level & coins
	var level int
	var coins int64
	err = tx.QueryRow(`
		SELECT u.level, w.coins
		FROM users u
		JOIN user_wallets w ON u.id = w.user_id
		WHERE u.id = $1
		FOR UPDATE
	`, userID).Scan(&level, &coins)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ImportOrder{}, 0, ErrUnauthorized
		}
		return ImportOrder{}, 0, err
	}

	if level < p.LevelRequired {
		return ImportOrder{}, 0, ErrForbidden
	}

	totalCost := int64(quantity) * p.ImportPrice
	if coins < totalCost {
		return ImportOrder{}, 0, ErrInsufficientCoins
	}

	// Deduct coins
	newCoins := coins - totalCost
	_, err = tx.Exec("UPDATE user_wallets SET coins = $1 WHERE user_id = $2", newCoins, userID)
	if err != nil {
		return ImportOrder{}, 0, err
	}

	// Create import order
	now := time.Now()
	completedAt := now.Add(time.Duration(p.ImportDurationSeconds) * time.Second)
	var orderID string

	err = tx.QueryRow(`
		INSERT INTO import_orders (user_id, product_id, quantity, total_cost, status, started_at, completed_at)
		VALUES ($1, $2, $3, $4, 'pending', $5, $6)
		RETURNING id
	`, userID, productID, quantity, totalCost, now, completedAt).Scan(&orderID)
	if err != nil {
		return ImportOrder{}, 0, err
	}

	// Apply quest progress (IMPORT_PRODUCT)
	if err := updateQuestProgress(tx, userID, "IMPORT_PRODUCT", quantity); err != nil {
		return ImportOrder{}, 0, err
	}

	if err := tx.Commit(); err != nil {
		return ImportOrder{}, 0, err
	}

	return ImportOrder{
		ID:            orderID,
		ProductID:     productID,
		Name:          p.Name,
		Quantity:      quantity,
		TimeRemaining: p.ImportDurationSeconds,
		TotalTime:     p.ImportDurationSeconds,
		Status:        "pending",
	}, newCoins, nil
}

func (s *ImportOrderService) Claim(userID, orderID string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var o struct {
		ProductID   string
		Quantity    int
		CompletedAt time.Time
		Status      string
	}
	err = tx.QueryRow(`
		SELECT product_id, quantity, completed_at, status
		FROM import_orders
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`, orderID, userID).Scan(&o.ProductID, &o.Quantity, &o.CompletedAt, &o.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	if o.Status != "pending" {
		return ErrConflict
	}

	if time.Now().Before(o.CompletedAt) {
		return ErrNotReady
	}

	// Update status
	_, err = tx.Exec(`
		UPDATE import_orders
		SET status = 'claimed', claimed_at = now()
		WHERE id = $1
	`, orderID)
	if err != nil {
		return err
	}

	// Add items to inventory
	_, err = tx.Exec(`
		INSERT INTO inventory (user_id, product_id, quantity)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, product_id)
		DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity
	`, userID, o.ProductID, o.Quantity)
	if err != nil {
		return err
	}

	return tx.Commit()
}

