package game

import "time"

type UserProfile struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email,omitempty"`
	Coins      int64  `json:"coins"`
	Gems       int64  `json:"gems"`
	Level      int    `json:"level"`
	CurrentXP  int    `json:"currentXp"`
	MaxXP      int    `json:"maxXp"`
	StallLevel int    `json:"stallLevel"`
}

type Product struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Category      string `json:"category"`
	ImportPrice   int64  `json:"importPrice"`
	SellPrice     int64  `json:"sellPrice"`
	TimeSeconds   int    `json:"timeSeconds"`
	LevelRequired int    `json:"levelRequired"`
	IconName      string `json:"iconName"`
	Color         string `json:"color"`
}

type ImportOrder struct {
	ID            string `json:"id"`
	ProductID     string `json:"productId"`
	Name          string `json:"name"`
	Quantity      int    `json:"quantity"`
	TimeRemaining int    `json:"timeRemaining"`
	TotalTime     int    `json:"totalTime"`
	Status        string `json:"status"`
}

type InventoryItem struct {
	ID            string `json:"id"`
	ProductID     string `json:"productId"`
	Name          string `json:"name"`
	Category      string `json:"category"`
	Quantity      int    `json:"quantity"`
	SellPrice     int64  `json:"sellPrice"`
	FastSellPrice int64  `json:"fastSellPrice"`
	IconName      string `json:"iconName"`
	Color         string `json:"color"`
	Description   string `json:"description"`
}

type StallSlot struct {
	ID               string  `json:"id"`
	ProductID        *string `json:"productId"`
	ProductName      *string `json:"productName"`
	ProductIcon      *string `json:"productIcon"`
	TimeRemaining    int     `json:"timeRemaining"`
	TotalTime        int     `json:"totalTime"`
	IsReadyToCollect bool    `json:"isReadyToCollect"`
	CoinsReward      int64   `json:"coinsReward"`
}

type Quest struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	TargetCount  int    `json:"targetCount"`
	CurrentCount int    `json:"currentCount"`
	RewardCoins  int64  `json:"rewardCoins"`
	RewardGems   int64  `json:"rewardGems"`
	IsCompleted  bool   `json:"isCompleted"`
	IsClaimed    bool   `json:"isClaimed"`
	Type         string `json:"type"`
}

type Friend struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Level     int    `json:"level"`
	Coins     int64  `json:"coins"`
	AvatarURL string `json:"avatarUrl,omitempty"`
	StallName string `json:"stallName"`
	CanHelp   bool   `json:"canHelp"`
	CanPrank  bool   `json:"canPrank"`
}

type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash []byte
	Coins        int64
	Gems         int64
	Level        int
	CurrentXP    int
	MaxXP        int
	StallLevel   int
	Inventory    map[string]int
	Orders       map[string]*OrderState
	Slots        map[string]*SlotState
	Quests       map[string]*QuestState
}

type OrderState struct {
	ID          string
	ProductID   string
	Quantity    int
	CreatedAt   time.Time
	CompletedAt time.Time
	Claimed     bool
}

type SlotState struct {
	ID        string
	ProductID string
	PlacedAt  time.Time
	ReadyAt   time.Time
}

type QuestState struct {
	ID           string
	Title        string
	Description  string
	TargetCount  int
	CurrentCount int
	RewardCoins  int64
	RewardGems   int64
	Type         string
	Claimed      bool
}

type Shipper struct {
	ID              string     `json:"id"`
	UserID          string     `json:"userId"`
	ShipperIndex    int        `json:"shipperIndex"`
	Level           int        `json:"level"`
	Status          string     `json:"status"`
	BusyUntil       *time.Time `json:"busyUntil"`
	Capacity        int        `json:"capacity"`
	Slots           int        `json:"slots"`
	SpeedMultiplier float64    `json:"speedMultiplier"`
}

type DeliveryOrder struct {
	ID                  string         `json:"id"`
	UserID              string         `json:"userId"`
	ShipperID           *string        `json:"shipperId,omitempty"`
	Items               map[string]int `json:"items"` // product_code -> quantity
	RewardCoins         int64          `json:"rewardCoins"`
	RewardXP            int64          `json:"rewardXp"`
	DeliveryTimeSeconds int            `json:"deliveryTimeSeconds"`
	Difficulty          string         `json:"difficulty"`
	Status              string         `json:"status"`
}
