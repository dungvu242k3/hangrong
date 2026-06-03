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
	rows, err := s.db.Query(`
		SELECT id, name, category, import_price, sell_price, import_duration_seconds, unlock_level, icon_name, color
		FROM products
		WHERE is_active = TRUE
		ORDER BY unlock_level ASC, code ASC
	`)
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

