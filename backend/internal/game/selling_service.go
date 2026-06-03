package game

import (
	"slices"
	"time"
)

type SellingService struct {
	store *Store
}

func NewSellingService(store *Store) *SellingService {
	return &SellingService{store: store}
}

func (s *SellingService) Slots(userID string) ([]StallSlot, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	out := make([]StallSlot, 0, len(user.Slots))
	for _, slot := range user.Slots {
		out = append(out, s.slotDTOLocked(slot, now))
	}
	slices.SortFunc(out, func(a, b StallSlot) int {
		if a.ID < b.ID {
			return -1
		}
		if a.ID > b.ID {
			return 1
		}
		return 0
	})
	return out, nil
}

func (s *SellingService) PlaceProduct(userID, slotID, productID string) (StallSlot, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return StallSlot{}, err
	}
	product, ok := s.store.productByIDLocked(productID)
	if !ok {
		return StallSlot{}, ErrNotFound
	}
	slot, ok := user.Slots[slotID]
	if !ok {
		return StallSlot{}, ErrNotFound
	}
	if slot.ProductID != "" {
		return StallSlot{}, ErrConflict
	}
	if user.Inventory[productID] <= 0 {
		return StallSlot{}, ErrInsufficientStock
	}

	now := time.Now()
	user.Inventory[productID]--
	slot.ProductID = productID
	slot.PlacedAt = now
	slot.ReadyAt = now.Add(time.Duration(product.TimeSeconds) * time.Second)
	applyQuestProgress(user, "place", 1)
	return s.slotDTOLocked(slot, now), nil
}

func (s *SellingService) CollectSlot(userID, slotID string) (int64, int64, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return 0, 0, err
	}
	slot, ok := user.Slots[slotID]
	if !ok {
		return 0, 0, ErrNotFound
	}
	if slot.ProductID == "" {
		return 0, 0, ErrConflict
	}
	product, ok := s.store.productByIDLocked(slot.ProductID)
	if !ok {
		return 0, 0, ErrNotFound
	}
	if time.Now().Before(slot.ReadyAt) {
		return 0, 0, ErrNotReady
	}

	reward := product.SellPrice
	user.Coins += reward
	user.CurrentXP += 15
	recalculateLevel(user)
	applyQuestProgress(user, "collect", 1)

	slot.ProductID = ""
	slot.PlacedAt = time.Time{}
	slot.ReadyAt = time.Time{}
	return reward, user.Coins, nil
}

func (s *SellingService) slotDTOLocked(slot *SlotState, now time.Time) StallSlot {
	if slot.ProductID == "" {
		return StallSlot{ID: slot.ID}
	}

	product, ok := s.store.productByIDLocked(slot.ProductID)
	if !ok {
		return StallSlot{ID: slot.ID}
	}

	productID := product.ID
	productName := product.Name
	productIcon := product.IconName
	remaining := max(0, int(slot.ReadyAt.Sub(now).Seconds()))
	total := max(1, int(slot.ReadyAt.Sub(slot.PlacedAt).Seconds()))
	return StallSlot{
		ID:               slot.ID,
		ProductID:        &productID,
		ProductName:      &productName,
		ProductIcon:      &productIcon,
		TimeRemaining:    remaining,
		TotalTime:        total,
		IsReadyToCollect: remaining == 0,
		CoinsReward:      product.SellPrice,
	}
}
