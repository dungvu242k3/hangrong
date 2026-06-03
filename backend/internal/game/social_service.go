package game

import (
	"database/sql"
)

type SocialService struct {
	db *sql.DB
}

func NewSocialService(db *sql.DB) *SocialService {
	return &SocialService{db: db}
}

func (s *SocialService) Friends() []Friend {
	// Return the default mock friends to maintain the offline single-player neighbor gameplay
	return []Friend{
		{ID: "friend-lan", Username: "co-lan", Level: 4, Coins: 1840, StallName: "Sạp Cô Lan", CanHelp: true, CanPrank: true},
		{ID: "friend-nam", Username: "anh-nam", Level: 3, Coins: 1210, StallName: "Bánh Mì Anh Nam", CanHelp: true, CanPrank: false},
		{ID: "friend-ha", Username: "be-ha", Level: 5, Coins: 2450, StallName: "Trà Đá Bé Hà", CanHelp: false, CanPrank: true},
	}
}

func (s *SocialService) NeighborSlots(neighborID string) ([]StallSlot, error) {
	friends := s.Friends()
	found := false
	for _, friend := range friends {
		if friend.ID == neighborID {
			found = true
			break
		}
	}
	if !found {
		return nil, ErrNotFound
	}

	// Fetch real Banh Mi product ID from PostgreSQL
	var pID string
	var pName string
	var pIcon string
	var pPrice int64
	err := s.db.QueryRow("SELECT id, name, icon_name, sell_price FROM products WHERE code = 'BANH_MI'").Scan(&pID, &pName, &pIcon, &pPrice)
	if err != nil {
		// Fallback values
		pID = "banh-mi"
		pName = "Bánh mì"
		pIcon = "sandwich"
		pPrice = 90
	}

	return []StallSlot{
		{
			ID:               neighborID + "-slot1",
			ProductID:        &pID,
			ProductName:      &pName,
			ProductIcon:      &pIcon,
			TimeRemaining:    0,
			TotalTime:        20,
			IsReadyToCollect: true,
			CoinsReward:      pPrice,
		},
		{
			ID:               neighborID + "-slot2",
			ProductID:        nil,
			ProductName:      nil,
			ProductIcon:      nil,
			TimeRemaining:    0,
			TotalTime:        0,
			IsReadyToCollect: false,
			CoinsReward:      0,
		},
	}, nil
}

func (s *SocialService) NeighborAction(userID, neighborID, action string) (int, error) {
	friends := s.Friends()
	found := false
	for _, friend := range friends {
		if friend.ID == neighborID {
			found = true
			break
		}
	}
	if !found {
		return 0, ErrNotFound
	}

	gained := 5
	if action == "prank" {
		gained = 3
	}

	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Update user XP in database
	_, _, _, err = addXP(tx, userID, gained)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return gained, nil
}

