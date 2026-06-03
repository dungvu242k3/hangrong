package game

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type SellingService struct {
	db *sql.DB
}

func NewSellingService(db *sql.DB) *SellingService {
	return &SellingService{db: db}
}

func parseSlotIndex(slotID string) (int, error) {
	var index int
	_, err := fmt.Sscanf(slotID, "slot%d", &index)
	if err != nil || index <= 0 {
		return 0, ErrNotFound
	}
	return index, nil
}

func (s *SellingService) Slots(userID string) ([]StallSlot, error) {
	now := time.Now()
	rows, err := s.db.Query(`
		SELECT ss.slot_index, ss.product_id, p.name, p.icon_name, ss.last_synced_at, ss.status, p.base_sell_duration_seconds, ss.pending_revenue
		FROM stall_slots ss
		JOIN stalls st ON ss.stall_id = st.id
		LEFT JOIN products p ON ss.product_id = p.id
		WHERE st.user_id = $1
		ORDER BY ss.slot_index ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []StallSlot
	for rows.Next() {
		var o struct {
			SlotIndex               int
			ProductID               sql.NullString
			ProductName             sql.NullString
			ProductIcon             sql.NullString
			LastSyncedAt            time.Time
			Status                  string
			BaseSellDurationSeconds sql.NullInt64
			PendingRevenue          int64
		}
		if err := rows.Scan(
			&o.SlotIndex,
			&o.ProductID,
			&o.ProductName,
			&o.ProductIcon,
			&o.LastSyncedAt,
			&o.Status,
			&o.BaseSellDurationSeconds,
			&o.PendingRevenue,
		); err != nil {
			return nil, err
		}

		slotID := fmt.Sprintf("slot%d", o.SlotIndex)
		if o.Status == "empty" || !o.ProductID.Valid {
			out = append(out, StallSlot{ID: slotID})
			continue
		}

		pID := o.ProductID.String
		pName := o.ProductName.String
		pIcon := o.ProductIcon.String
		duration := int(o.BaseSellDurationSeconds.Int64)

		timeRemaining := max(0, int(o.LastSyncedAt.Add(time.Duration(duration)*time.Second).Sub(now).Seconds()))

		out = append(out, StallSlot{
			ID:               slotID,
			ProductID:        &pID,
			ProductName:      &pName,
			ProductIcon:      &pIcon,
			TimeRemaining:    timeRemaining,
			TotalTime:        duration,
			IsReadyToCollect: timeRemaining == 0,
			CoinsReward:      o.PendingRevenue,
		})
	}
	return out, nil
}

func (s *SellingService) PlaceProduct(userID, slotID, productID string) (StallSlot, error) {
	slotIndex, err := parseSlotIndex(slotID)
	if err != nil {
		return StallSlot{}, err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return StallSlot{}, err
	}
	defer tx.Rollback()

	// 1. Get stall details and user level
	var stall struct {
		ID    string
		Level int
	}
	err = tx.QueryRow("SELECT id, level FROM stalls WHERE user_id = $1 FOR UPDATE", userID).Scan(&stall.ID, &stall.Level)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StallSlot{}, ErrNotFound
		}
		return StallSlot{}, err
	}

	// Level 1 allows slot 1-3, Level 2 allows slot 1-4, Level 3 allows slot 1-5
	if slotIndex > stall.Level+2 {
		return StallSlot{}, ErrForbidden
	}

	// 2. Get slot details
	var slot struct {
		ID     string
		Status string
	}
	err = tx.QueryRow(`
		SELECT id, status FROM stall_slots
		WHERE stall_id = $1 AND slot_index = $2
		FOR UPDATE
	`, stall.ID, slotIndex).Scan(&slot.ID, &slot.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StallSlot{}, ErrNotFound
		}
		return StallSlot{}, err
	}

	if slot.Status != "empty" {
		return StallSlot{}, ErrConflict
	}

	// 3. Check product details
	var p struct {
		ID                       string
		Name                     string
		IconName                 string
		SellPrice                int64
		BaseSellDurationSeconds  int
	}
	err = tx.QueryRow(`
		SELECT id, name, icon_name, sell_price, base_sell_duration_seconds
		FROM products
		WHERE id = $1 AND is_active = TRUE
	`, productID).Scan(&p.ID, &p.Name, &p.IconName, &p.SellPrice, &p.BaseSellDurationSeconds)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StallSlot{}, ErrNotFound
		}
		return StallSlot{}, err
	}

	// 4. Check inventory
	var qty int
	err = tx.QueryRow(`
		SELECT quantity FROM inventory
		WHERE user_id = $1 AND product_id = $2
		FOR UPDATE
	`, userID, productID).Scan(&qty)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StallSlot{}, ErrInsufficientStock
		}
		return StallSlot{}, err
	}

	if qty <= 0 {
		return StallSlot{}, ErrInsufficientStock
	}

	// 5. Update inventory
	_, err = tx.Exec(`
		UPDATE inventory
		SET quantity = quantity - 1
		WHERE user_id = $1 AND product_id = $2
	`, userID, productID)
	if err != nil {
		return StallSlot{}, err
	}

	// 6. Update stall slot
	_, err = tx.Exec(`
		UPDATE stall_slots
		SET product_id = $1, quantity = 1, pending_revenue = $2, status = 'selling', last_synced_at = now()
		WHERE id = $3
	`, productID, p.SellPrice, slot.ID)
	if err != nil {
		return StallSlot{}, err
	}

	// 7. Update quest progress
	if err := updateQuestProgress(tx, userID, "PLACE_PRODUCT", 1); err != nil {
		return StallSlot{}, err
	}

	if err := tx.Commit(); err != nil {
		return StallSlot{}, err
	}

	pID := p.ID
	pName := p.Name
	pIcon := p.IconName
	return StallSlot{
		ID:               slotID,
		ProductID:        &pID,
		ProductName:      &pName,
		ProductIcon:      &pIcon,
		TimeRemaining:    p.BaseSellDurationSeconds,
		TotalTime:        p.BaseSellDurationSeconds,
		IsReadyToCollect: false,
		CoinsReward:      p.SellPrice,
	}, nil
}

func (s *SellingService) CollectSlot(userID, slotID string) (int64, int64, error) {
	slotIndex, err := parseSlotIndex(slotID)
	if err != nil {
		return 0, 0, err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback()

	// 1. Get stall details
	var stallID string
	err = tx.QueryRow("SELECT id FROM stalls WHERE user_id = $1", userID).Scan(&stallID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	// 2. Get slot details
	var slot struct {
		ID                      string
		ProductID               string
		PendingRevenue          int64
		Status                  string
		LastSyncedAt            time.Time
		BaseSellDurationSeconds int
	}
	err = tx.QueryRow(`
		SELECT ss.id, ss.product_id, ss.pending_revenue, ss.status, ss.last_synced_at, p.base_sell_duration_seconds
		FROM stall_slots ss
		JOIN products p ON ss.product_id = p.id
		WHERE ss.stall_id = $1 AND ss.slot_index = $2
		FOR UPDATE
	`, stallID, slotIndex).Scan(
		&slot.ID,
		&slot.ProductID,
		&slot.PendingRevenue,
		&slot.Status,
		&slot.LastSyncedAt,
		&slot.BaseSellDurationSeconds,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	if slot.Status != "selling" {
		return 0, 0, ErrConflict
	}

	// Check time countdown
	completedAt := slot.LastSyncedAt.Add(time.Duration(slot.BaseSellDurationSeconds) * time.Second)
	if time.Now().Before(completedAt) {
		return 0, 0, ErrNotReady
	}

	// 3. Reset slot
	_, err = tx.Exec(`
		UPDATE stall_slots
		SET product_id = NULL, quantity = 0, pending_revenue = 0, status = 'empty', last_synced_at = now()
		WHERE id = $1
	`, slot.ID)
	if err != nil {
		return 0, 0, err
	}

	// 4. Update coins in wallet
	var currentCoins int64
	err = tx.QueryRow(`
		UPDATE user_wallets
		SET coins = coins + $1
		WHERE user_id = $2
		RETURNING coins
	`, slot.PendingRevenue, userID).Scan(&currentCoins)
	if err != nil {
		return 0, 0, err
	}

	// 5. Add XP (8 XP per collection)
	_, _, _, err = addXP(tx, userID, 8)
	if err != nil {
		return 0, 0, err
	}

	// 6. Update quest progress
	if err := updateQuestProgress(tx, userID, "COLLECT_REVENUE", 1); err != nil {
		return 0, 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, err
	}

	return slot.PendingRevenue, currentCoins, nil
}

