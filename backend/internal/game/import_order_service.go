package game

import (
	"slices"
	"time"
)

type ImportOrderService struct {
	store *Store
}

func NewImportOrderService(store *Store) *ImportOrderService {
	return &ImportOrderService{store: store}
}

func (s *ImportOrderService) ActiveOrders(userID string) ([]ImportOrder, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	out := make([]ImportOrder, 0, len(user.Orders))
	for _, order := range user.Orders {
		if order.Claimed {
			continue
		}
		product, ok := s.store.productByIDLocked(order.ProductID)
		if !ok {
			continue
		}
		out = append(out, importOrderDTO(order, product, now))
	}
	slices.SortFunc(out, func(a, b ImportOrder) int {
		return a.TimeRemaining - b.TimeRemaining
	})
	return out, nil
}

func (s *ImportOrderService) Create(userID, productID string, quantity int) (ImportOrder, int64, error) {
	if quantity <= 0 || quantity > 99 {
		return ImportOrder{}, 0, ErrInvalidInput
	}

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return ImportOrder{}, 0, err
	}
	product, ok := s.store.productByIDLocked(productID)
	if !ok {
		return ImportOrder{}, 0, ErrNotFound
	}
	if user.Level < product.LevelRequired {
		return ImportOrder{}, 0, ErrForbidden
	}

	totalCost := int64(quantity) * product.ImportPrice
	if user.Coins < totalCost {
		return ImportOrder{}, 0, ErrInsufficientCoins
	}

	now := time.Now()
	order := &OrderState{
		ID:          newID("ord"),
		ProductID:   product.ID,
		Quantity:    quantity,
		CreatedAt:   now,
		CompletedAt: now.Add(time.Duration(product.TimeSeconds) * time.Second),
	}
	user.Coins -= totalCost
	user.Orders[order.ID] = order
	applyQuestProgress(user, "import", quantity)

	return importOrderDTO(order, product, now), user.Coins, nil
}

func (s *ImportOrderService) Claim(userID, orderID string) error {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return err
	}
	order, ok := user.Orders[orderID]
	if !ok {
		return ErrNotFound
	}
	if order.Claimed {
		return ErrConflict
	}
	if time.Now().Before(order.CompletedAt) {
		return ErrNotReady
	}

	user.Inventory[order.ProductID] += order.Quantity
	order.Claimed = true
	applyQuestProgress(user, "claim_import", 1)
	return nil
}
