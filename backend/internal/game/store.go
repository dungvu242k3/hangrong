package game

import (
	"sync"
	"time"
)

type Store struct {
	mu            sync.RWMutex
	users         map[string]*User
	usersByName   map[string]string
	accessTokens  map[string]string
	refreshTokens map[string]string
	products      []Product
	friends       []Friend
}

func NewStore() *Store {
	return &Store{
		users:         map[string]*User{},
		usersByName:   map[string]string{},
		accessTokens:  map[string]string{},
		refreshTokens: map[string]string{},
		products: []Product{
			{ID: "banh-mi", Name: "Banh mi", Category: "food", ImportPrice: 50, SellPrice: 90, TimeSeconds: 20, LevelRequired: 1, IconName: "sandwich", Color: "#F97316"},
			{ID: "tra-da", Name: "Tra da", Category: "drink", ImportPrice: 25, SellPrice: 45, TimeSeconds: 15, LevelRequired: 1, IconName: "cup-soda", Color: "#14B8A6"},
			{ID: "huong-duong", Name: "Huong duong", Category: "food", ImportPrice: 35, SellPrice: 60, TimeSeconds: 25, LevelRequired: 1, IconName: "flower", Color: "#EAB308"},
			{ID: "banh-cuon", Name: "Banh cuon", Category: "food", ImportPrice: 85, SellPrice: 140, TimeSeconds: 35, LevelRequired: 2, IconName: "scroll", Color: "#A855F7"},
			{ID: "tau-hu", Name: "Tau hu nong", Category: "drink", ImportPrice: 70, SellPrice: 120, TimeSeconds: 30, LevelRequired: 2, IconName: "soup", Color: "#F43F5E"},
			{ID: "to-he", Name: "To he", Category: "toy", ImportPrice: 120, SellPrice: 210, TimeSeconds: 45, LevelRequired: 3, IconName: "toy-brick", Color: "#22C55E"},
		},
		friends: []Friend{
			{ID: "friend-lan", Username: "co-lan", Level: 4, Coins: 1840, StallName: "Sap Co Lan", CanHelp: true, CanPrank: true},
			{ID: "friend-nam", Username: "anh-nam", Level: 3, Coins: 1210, StallName: "Banh Mi Anh Nam", CanHelp: true, CanPrank: false},
			{ID: "friend-ha", Username: "be-ha", Level: 5, Coins: 2450, StallName: "Tra Da Be Ha", CanHelp: false, CanPrank: true},
		},
	}
}

func (s *Store) getUserLocked(userID string) (*User, error) {
	user, ok := s.users[userID]
	if !ok {
		return nil, ErrUnauthorized
	}
	return user, nil
}

func (s *Store) productByIDLocked(productID string) (Product, bool) {
	for _, product := range s.products {
		if product.ID == productID {
			return product, true
		}
	}
	return Product{}, false
}

func starterSlots() map[string]*SlotState {
	return map[string]*SlotState{
		"slot-1": {ID: "slot-1"},
		"slot-2": {ID: "slot-2"},
		"slot-3": {ID: "slot-3"},
	}
}

func starterQuests() map[string]*QuestState {
	return map[string]*QuestState{
		"daily-import":  {ID: "daily-import", Title: "Nhap hang dau ngay", Description: "Nhap 3 mon hang bat ky.", TargetCount: 3, RewardCoins: 120, RewardGems: 0, Type: "daily"},
		"daily-collect": {ID: "daily-collect", Title: "Thu tien ban hang", Description: "Thu tien tu sap 2 lan.", TargetCount: 2, RewardCoins: 180, RewardGems: 1, Type: "daily"},
		"main-upgrade":  {ID: "main-upgrade", Title: "Nang cap sap", Description: "Nang cap sap hang len cap moi.", TargetCount: 1, RewardCoins: 300, RewardGems: 2, Type: "main"},
	}
}

func defaultUser(username, email string, passwordHash []byte) *User {
	return &User{
		ID:           newID("usr"),
		Username:     username,
		Email:        email,
		PasswordHash: passwordHash,
		Coins:        1200,
		Gems:         5,
		Level:        1,
		CurrentXP:    0,
		MaxXP:        100,
		StallLevel:   1,
		Inventory:    map[string]int{"banh-mi": 3, "tra-da": 3},
		Orders:       map[string]*OrderState{},
		Slots:        starterSlots(),
		Quests:       starterQuests(),
	}
}

func orderStatus(order *OrderState, now time.Time) string {
	if order.Claimed {
		return "claimed"
	}
	if !now.Before(order.CompletedAt) {
		return "completed"
	}
	return "pending"
}
