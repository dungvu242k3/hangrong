package game

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"math/rand"
	"time"
)

type DeliveryService struct {
	db *sql.DB
}

func NewDeliveryService(db *sql.DB) *DeliveryService {
	return &DeliveryService{db: db}
}

// Shippers fetches all shippers for a user, auto-initializing unlocked ones based on player level
func (s *DeliveryService) Shippers(userID string) ([]Shipper, error) {
	var userLevel int
	err := s.db.QueryRow("SELECT level FROM users WHERE id = $1", userID).Scan(&userLevel)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	if userLevel < 30 {
		return []Shipper{}, nil
	}

	// Determine how many shippers should be unlocked
	shippersToUnlock := 0
	if userLevel >= 30 {
		shippersToUnlock = 1
	}
	if userLevel >= 40 {
		shippersToUnlock = 2
	}
	if userLevel >= 50 {
		shippersToUnlock = 3
	}

	// Auto-initialize missing shippers
	for idx := 1; idx <= shippersToUnlock; idx++ {
		_, err := s.db.Exec(`
			INSERT INTO shippers (user_id, shipper_index, level, status, capacity, slots, speed_multiplier)
			VALUES ($1, $2, 1, 'idle', 10, 1, 1.00)
			ON CONFLICT (user_id, shipper_index) DO NOTHING
		`, userID, idx)
		if err != nil {
			return nil, err
		}
	}

	rows, err := s.db.Query(`
		SELECT id, user_id, shipper_index, level, status, busy_until, capacity, slots, speed_multiplier
		FROM shippers
		WHERE user_id = $1
		ORDER BY shipper_index ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Shipper
	for rows.Next() {
		var sh Shipper
		var busyUntil sql.NullTime
		err := rows.Scan(
			&sh.ID,
			&sh.UserID,
			&sh.ShipperIndex,
			&sh.Level,
			&sh.Status,
			&busyUntil,
			&sh.Capacity,
			&sh.Slots,
			&sh.SpeedMultiplier,
		)
		if err != nil {
			return nil, err
		}
		if busyUntil.Valid {
			sh.BusyUntil = &busyUntil.Time
		}
		out = append(out, sh)
	}
	return out, nil
}

// ActiveOrders retrieves the 12 active orders, regenerating if expired or missing
func (s *DeliveryService) ActiveOrders(userID string) ([]DeliveryOrder, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var userLevel int
	err = tx.QueryRow("SELECT level FROM users WHERE id = $1", userID).Scan(&userLevel)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	if userLevel < 30 {
		return []DeliveryOrder{}, nil
	}

	// Fetch current orders
	rows, err := tx.Query(`
		SELECT id, user_id, shipper_id, items, reward_coins, reward_xp, delivery_time_seconds, difficulty, status, created_at
		FROM delivery_orders
		WHERE user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}

	type orderRecord struct {
		Order     DeliveryOrder
		CreatedAt time.Time
	}

	var existing []orderRecord
	var countDelivering int
	var hasExpiredPending bool
	now := time.Now()

	for rows.Next() {
		var r orderRecord
		var itemsRaw []byte
		var shipperID sql.NullString
		err := rows.Scan(
			&r.Order.ID,
			&r.Order.UserID,
			&shipperID,
			&itemsRaw,
			&r.Order.RewardCoins,
			&r.Order.RewardXP,
			&r.Order.DeliveryTimeSeconds,
			&r.Order.Difficulty,
			&r.Order.Status,
			&r.CreatedAt,
		)
		if err != nil {
			rows.Close()
			return nil, err
		}

		if shipperID.Valid {
			r.Order.ShipperID = &shipperID.String
		}

		// Decode items
		var itemsMap map[string]int
		if err := json.Unmarshal(itemsRaw, &itemsMap); err != nil {
			rows.Close()
			return nil, err
		}
		r.Order.Items = itemsMap

		if r.Order.Status == "delivering" {
			countDelivering++
		} else if r.Order.Status == "pending" && now.Sub(r.CreatedAt) > 1*time.Minute {
			hasExpiredPending = true
		}

		existing = append(existing, r)
	}
	rows.Close()

	// If missing orders or expired ones exist, refresh the list
	if len(existing) < 12 || hasExpiredPending {
		// Delete all pending orders
		_, err = tx.Exec("DELETE FROM delivery_orders WHERE user_id = $1 AND status = 'pending'", userID)
		if err != nil {
			return nil, err
		}

		// Keep only delivering ones
		var kept []DeliveryOrder
		for _, rec := range existing {
			if rec.Order.Status == "delivering" {
				kept = append(kept, rec.Order)
			}
		}

		needed := 12 - len(kept)

		// Get products unlocked for the user
		prodRows, err := tx.Query(`
			SELECT id, sell_price FROM products WHERE is_active = TRUE AND unlock_level <= $1
		`, userLevel)
		if err != nil {
			return nil, err
		}

		type prodItem struct {
			ID        string
			SellPrice int64
		}
		var unlockedProds []prodItem
		for prodRows.Next() {
			var p prodItem
			if err := prodRows.Scan(&p.ID, &p.SellPrice); err == nil {
				unlockedProds = append(unlockedProds, p)
			}
		}
		prodRows.Close()

		if len(unlockedProds) > 0 {
			var stallLevel int
			_ = tx.QueryRow("SELECT level FROM stalls WHERE user_id = $1", userID).Scan(&stallLevel)

			rSource := rand.New(rand.NewSource(time.Now().UnixNano()))

			for i := 0; i < needed; i++ {
				// Pick difficulty
				diff := "easy"
				if stallLevel >= 30 {
					roll := rSource.Float64()
					if roll < 0.15 {
						diff = "hard"
					} else if roll < 0.50 {
						diff = "medium"
					}
				} else if stallLevel >= 10 {
					roll := rSource.Float64()
					if roll < 0.30 {
						diff = "medium"
					}
				}

				// Generate items
				numItems := 1
				minQty, maxQty := 1, 5
				coinMult, xpMult := 1.10, 0.10
				minXP := int64(5)
				minDuration, maxDuration := 60, 120

				switch diff {
				case "medium":
					numItems = 1 + rSource.Intn(2) // 1-2
					minQty, maxQty = 5, 15
					coinMult, xpMult = 1.25, 0.15
					minXP = 15
					minDuration, maxDuration = 120, 240
				case "hard":
					numItems = 2 + rSource.Intn(2) // 2-3
					minQty, maxQty = 15, 30
					coinMult, xpMult = 1.50, 0.20
					minXP = 40
					minDuration, maxDuration = 240, 600
				}

				if numItems > len(unlockedProds) {
					numItems = len(unlockedProds)
				}

				// Pick random products
				chosenIndices := rSource.Perm(len(unlockedProds))[:numItems]
				itemsMap := make(map[string]int)
				var baseValue int64

				for _, idx := range chosenIndices {
					p := unlockedProds[idx]
					qty := minQty + rSource.Intn(maxQty-minQty+1)
					itemsMap[p.ID] = qty
					baseValue += int64(qty) * p.SellPrice
				}

				itemsJSON, _ := json.Marshal(itemsMap)
				rewardCoins := int64(float64(baseValue) * coinMult)
				rewardXP := int64(float64(baseValue) * xpMult)
				if rewardXP < minXP {
					rewardXP = minXP
				}
				durationSeconds := minDuration + rSource.Intn(maxDuration-minDuration+1)

				var newOrderID string
				err = tx.QueryRow(`
					INSERT INTO delivery_orders (user_id, items, reward_coins, reward_xp, delivery_time_seconds, difficulty, status, created_at, updated_at)
					VALUES ($1, $2, $3, $4, $5, $6, 'pending', now(), now())
					RETURNING id
				`, userID, itemsJSON, rewardCoins, rewardXP, durationSeconds, diff).Scan(&newOrderID)
				if err != nil {
					return nil, err
				}

				kept = append(kept, DeliveryOrder{
					ID:                  newOrderID,
					UserID:              userID,
					Items:               itemsMap,
					RewardCoins:         rewardCoins,
					RewardXP:            rewardXP,
					DeliveryTimeSeconds: durationSeconds,
					Difficulty:          diff,
					Status:              "pending",
				})
			}
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return kept, nil
	}

	// No refresh needed, return existing
	var out []DeliveryOrder
	for _, rec := range existing {
		out = append(out, rec.Order)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return out, nil
}

// Deliver assigns multiple orders to a shipper and begins delivery
func (s *DeliveryService) Deliver(userID, shipperID string, orderIDs []string) error {
	if len(orderIDs) == 0 {
		return ErrInvalidInput
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Fetch and lock shipper
	var sh Shipper
	var busyUntil sql.NullTime
	err = tx.QueryRow(`
		SELECT id, user_id, level, status, busy_until, capacity, slots, speed_multiplier
		FROM shippers
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`, shipperID, userID).Scan(
		&sh.ID, &sh.UserID, &sh.Level, &sh.Status, &busyUntil, &sh.Capacity, &sh.Slots, &sh.SpeedMultiplier,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	if sh.Status != "idle" {
		return ErrConflict
	}

	if len(orderIDs) > sh.Slots {
		return ErrForbidden // Exceeds shipper simultaneous slots limit
	}

	// Fetch and lock selected orders
	var orders []DeliveryOrder
	rows, err := tx.Query(`
		SELECT id, items, status, delivery_time_seconds
		FROM delivery_orders
		WHERE id = ANY($1) AND user_id = $2 AND status = 'pending'
		FOR UPDATE
	`, orderIDs, userID)
	if err != nil {
		log.Printf("DEBUG: tx.Query selected orders failed: %v", err)
		return err
	}

	for rows.Next() {
		var o DeliveryOrder
		var itemsRaw []byte
		if err := rows.Scan(&o.ID, &itemsRaw, &o.Status, &o.DeliveryTimeSeconds); err != nil {
			log.Printf("DEBUG: scan order row failed: %v", err)
		} else {
			_ = json.Unmarshal(itemsRaw, &o.Items)
			orders = append(orders, o)
		}
	}
	rows.Close()

	if len(orders) != len(orderIDs) {
		log.Printf("DEBUG: order count mismatch: got %d orders, requested %d (IDs: %v)", len(orders), len(orderIDs), orderIDs)
		return ErrNotFound // Some orders do not exist or are already delivering
	}

	// Aggregate and check items
	totalItems := 0
	aggItems := make(map[string]int)
	for _, o := range orders {
		for pID, qty := range o.Items {
			aggItems[pID] += qty
			totalItems += qty
		}
	}

	if totalItems > sh.Capacity {
		return ErrForbidden // Exceeds shipper cargo capacity
	}

	// Verify inventory
	for pID, reqQty := range aggItems {
		var invQty int
		err := tx.QueryRow(`
			SELECT quantity FROM inventory WHERE user_id = $1 AND product_id = $2 FOR UPDATE
		`, userID, pID).Scan(&invQty)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrInsufficientStock
			}
			return err
		}
		if invQty < reqQty {
			return ErrInsufficientStock
		}
	}

	// Deduct inventory
	for pID, reqQty := range aggItems {
		_, err := tx.Exec(`
			UPDATE inventory SET quantity = quantity - $1 WHERE user_id = $2 AND product_id = $3
		`, reqQty, userID, pID)
		if err != nil {
			return err
		}
	}

	// Find max delivery time
	maxTime := 0
	for _, o := range orders {
		if o.DeliveryTimeSeconds > maxTime {
			maxTime = o.DeliveryTimeSeconds
		}
	}

	// Assign orders to shipper
	_, err = tx.Exec(`
		UPDATE delivery_orders
		SET status = 'delivering', shipper_id = $1, updated_at = now()
		WHERE id = ANY($2)
	`, shipperID, orderIDs)
	if err != nil {
		return err
	}

	// Set shipper busy
	duration := time.Duration(float64(maxTime)/sh.SpeedMultiplier) * time.Second
	busyTime := time.Now().Add(duration)

	_, err = tx.Exec(`
		UPDATE shippers
		SET status = 'delivering', busy_until = $1, updated_at = now()
		WHERE id = $2
	`, busyTime, shipperID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// ClaimReward claims rewards for completed deliveries and returns user details
func (s *DeliveryService) ClaimReward(userID, shipperID string) (int64, int64, int, int64, int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}
	defer tx.Rollback()

	// Fetch shipper
	var sh Shipper
	var busyUntil sql.NullTime
	err = tx.QueryRow(`
		SELECT id, status, busy_until
		FROM shippers
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`, shipperID, userID).Scan(&sh.ID, &sh.Status, &busyUntil)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, 0, 0, 0, ErrNotFound
		}
		return 0, 0, 0, 0, 0, err
	}

	if sh.Status != "delivering" {
		return 0, 0, 0, 0, 0, ErrConflict
	}

	if !busyUntil.Valid || busyUntil.Time.After(time.Now()) {
		return 0, 0, 0, 0, 0, ErrNotReady
	}

	// Fetch associated orders
	rows, err := tx.Query(`
		SELECT reward_coins, reward_xp FROM delivery_orders
		WHERE shipper_id = $1 AND user_id = $2
	`, shipperID, userID)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	var totalCoins, totalXP int64
	for rows.Next() {
		var coins, xp int64
		if err := rows.Scan(&coins, &xp); err == nil {
			totalCoins += coins
			totalXP += xp
		}
	}
	rows.Close()

	// Update user wallet
	var currentCoins, currentGems int64
	err = tx.QueryRow("SELECT coins, gems FROM user_wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&currentCoins, &currentGems)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	newCoins := currentCoins + totalCoins
	_, err = tx.Exec("UPDATE user_wallets SET coins = $1 WHERE user_id = $2", newCoins, userID)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	// Add XP
	newLevel, _, _, err := addXP(tx, userID, int(totalXP))
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	// Delete completed orders
	_, err = tx.Exec("DELETE FROM delivery_orders WHERE shipper_id = $1 AND user_id = $2", shipperID, userID)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	// Reset shipper to idle
	_, err = tx.Exec(`
		UPDATE shippers
		SET status = 'idle', busy_until = NULL, updated_at = now()
		WHERE id = $1
	`, shipperID)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	// Apply quest progress (DELIVER_ORDER)
	if err := updateQuestProgress(tx, userID, "DELIVER_ORDER", 1); err != nil {
		return 0, 0, 0, 0, 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, 0, 0, 0, err
	}

	return totalCoins, totalXP, newLevel, newCoins, currentGems, nil
}

// UpgradeShipper upgrades shipper capacity, slots and speed using Coins
func (s *DeliveryService) UpgradeShipper(userID, shipperID string) (Shipper, int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return Shipper{}, 0, err
	}
	defer tx.Rollback()

	// Fetch shipper
	var sh Shipper
	var busyUntil sql.NullTime
	err = tx.QueryRow(`
		SELECT id, user_id, shipper_index, level, status, busy_until, capacity, slots, speed_multiplier
		FROM shippers
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`, shipperID, userID).Scan(
		&sh.ID, &sh.UserID, &sh.ShipperIndex, &sh.Level, &sh.Status, &busyUntil, &sh.Capacity, &sh.Slots, &sh.SpeedMultiplier,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Shipper{}, 0, ErrNotFound
		}
		return Shipper{}, 0, err
	}

	if sh.Level >= 5 {
		return Shipper{}, 0, ErrConflict // Max level reached
	}

	cost := int64(0)
	switch sh.Level + 1 {
	case 2:
		cost = 50000
	case 3:
		cost = 150000
	case 4:
		cost = 400000
	case 5:
		cost = 1000000
	}

	// Check coins
	var coins int64
	err = tx.QueryRow("SELECT coins FROM user_wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&coins)
	if err != nil {
		return Shipper{}, 0, err
	}

	if coins < cost {
		return Shipper{}, 0, ErrInsufficientCoins
	}

	// Deduct coins
	newCoins := coins - cost
	_, err = tx.Exec("UPDATE user_wallets SET coins = $1 WHERE user_id = $2", newCoins, userID)
	if err != nil {
		return Shipper{}, 0, err
	}

	// Upgrade stats
	newLevel := sh.Level + 1
	newCapacity := 10
	newSlots := 1
	newSpeed := 1.00

	switch newLevel {
	case 2:
		newCapacity = 15
		newSlots = 1
		newSpeed = 1.15
	case 3:
		newCapacity = 20
		newSlots = 2
		newSpeed = 1.30
	case 4:
		newCapacity = 30
		newSlots = 2
		newSpeed = 1.50
	case 5:
		newCapacity = 50
		newSlots = 3
		newSpeed = 1.80
	}

	_, err = tx.Exec(`
		UPDATE shippers
		SET level = $1, capacity = $2, slots = $3, speed_multiplier = $4, updated_at = now()
		WHERE id = $5
	`, newLevel, newCapacity, newSlots, newSpeed, shipperID)
	if err != nil {
		return Shipper{}, 0, err
	}

	sh.Level = newLevel
	sh.Capacity = newCapacity
	sh.Slots = newSlots
	sh.SpeedMultiplier = newSpeed
	if busyUntil.Valid {
		sh.BusyUntil = &busyUntil.Time
	}

	if err := tx.Commit(); err != nil {
		return Shipper{}, 0, err
	}

	return sh, newCoins, nil
}

// InstantComplete finishes a busy shipper's journey instantly using Gems
func (s *DeliveryService) InstantComplete(userID, shipperID string) (int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Fetch shipper
	var sh Shipper
	var busyUntil sql.NullTime
	err = tx.QueryRow(`
		SELECT id, status, busy_until
		FROM shippers
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`, shipperID, userID).Scan(&sh.ID, &sh.Status, &busyUntil)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrNotFound
		}
		return 0, err
	}

	if sh.Status != "delivering" || !busyUntil.Valid || busyUntil.Time.Before(time.Now()) {
		return 0, ErrConflict
	}

	// Calculate gem cost: 1 gem per minute remaining, min 1
	remainingSeconds := int(time.Until(busyUntil.Time).Seconds())
	gemCost := (remainingSeconds + 59) / 60
	if gemCost < 1 {
		gemCost = 1
	}

	// Fetch gems
	var gems int64
	err = tx.QueryRow("SELECT gems FROM user_wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&gems)
	if err != nil {
		return 0, err
	}

	if gems < int64(gemCost) {
		return 0, ErrInsufficientGems
	}

	// Deduct gems
	newGems := gems - int64(gemCost)
	_, err = tx.Exec("UPDATE user_wallets SET gems = $1 WHERE user_id = $2", newGems, userID)
	if err != nil {
		return 0, err
	}

	// Set shipper finished (busy_until = now())
	_, err = tx.Exec(`
		UPDATE shippers
		SET busy_until = now(), updated_at = now()
		WHERE id = $1
	`, shipperID)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return newGems, nil
}
