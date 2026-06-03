package game

import (
	"database/sql"
	"errors"
)

type InventoryService struct {
	db *sql.DB
}

func NewInventoryService(db *sql.DB) *InventoryService {
	return &InventoryService{db: db}
}

func (s *InventoryService) List(userID string) ([]InventoryItem, error) {
	rows, err := s.db.Query(`
		SELECT i.id, i.product_id, p.name, p.category, i.quantity, p.sell_price, p.icon_name, p.color
		FROM inventory i
		JOIN products p ON i.product_id = p.id
		WHERE i.user_id = $1 AND i.quantity > 0
		ORDER BY p.unlock_level ASC, p.code ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []InventoryItem
	for rows.Next() {
		var item InventoryItem
		var sellPrice int64
		err := rows.Scan(
			&item.ID,
			&item.ProductID,
			&item.Name,
			&item.Category,
			&item.Quantity,
			&sellPrice,
			&item.IconName,
			&item.Color,
		)
		if err == nil {
			item.SellPrice = sellPrice
			// fast sell price is 60% of sell price
			item.FastSellPrice = sellPrice * 6 / 10
			item.Description = "Ready to place on your stall."
			out = append(out, item)
		}
	}
	return out, nil
}

func (s *InventoryService) FastSell(userID, productID string, quantity int) (int64, error) {
	if quantity <= 0 || quantity > 999 {
		return 0, ErrInvalidInput
	}

	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Get quantity in inventory
	var currentQty int
	err = tx.QueryRow(`
		SELECT quantity FROM inventory
		WHERE user_id = $1 AND product_id = $2
		FOR UPDATE
	`, userID, productID).Scan(&currentQty)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrInsufficientStock
		}
		return 0, err
	}

	if currentQty < quantity {
		return 0, ErrInsufficientStock
	}

	// 2. Get product sell price
	var sellPrice int64
	err = tx.QueryRow("SELECT sell_price FROM products WHERE id = $1", productID).Scan(&sellPrice)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrNotFound
		}
		return 0, err
	}

	gained := (sellPrice * 6 / 10) * int64(quantity)

	// 3. Deduct stock
	_, err = tx.Exec(`
		UPDATE inventory
		SET quantity = quantity - $1
		WHERE user_id = $2 AND product_id = $3
	`, quantity, userID, productID)
	if err != nil {
		return 0, err
	}

	// 4. Add coins to wallet
	_, err = tx.Exec(`
		UPDATE user_wallets
		SET coins = coins + $1
		WHERE user_id = $2
	`, gained, userID)
	if err != nil {
		return 0, err
	}

	// 5. Update quest progress
	if err := updateQuestProgress(tx, userID, "COLLECT_REVENUE", int(gained/10)); err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return gained, nil
}

