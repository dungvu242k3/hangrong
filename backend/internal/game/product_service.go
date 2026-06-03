package game

import (
	"database/sql"
	"log"
)

type ProductService struct {
	db *sql.DB
}

func NewProductService(db *sql.DB) *ProductService {
	return &ProductService{db: db}
}

func (s *ProductService) UnlockedProducts(userID string) []Product {
	// Get user level
	var level int = 1
	err := s.db.QueryRow("SELECT level FROM users WHERE id = $1", userID).Scan(&level)
	if err != nil {
		log.Printf("error getting user level: %v", err)
	}

	rows, err := s.db.Query(`
		SELECT id, name, category, import_price, sell_price, import_duration_seconds, unlock_level, icon_name, color
		FROM products
		WHERE is_active = TRUE AND unlock_level <= $1
		ORDER BY unlock_level ASC, code ASC
	`, level)
	if err != nil {
		log.Printf("error querying products: %v", err)
		return []Product{}
	}
	defer rows.Close()

	var out []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Category,
			&p.ImportPrice,
			&p.SellPrice,
			&p.TimeSeconds,
			&p.LevelRequired,
			&p.IconName,
			&p.Color,
		)
		if err == nil {
			out = append(out, p)
		}
	}
	return out
}

