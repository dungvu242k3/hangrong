package game

type InventoryService struct {
	store *Store
}

func NewInventoryService(store *Store) *InventoryService {
	return &InventoryService{store: store}
}

func (s *InventoryService) List(userID string) ([]InventoryItem, error) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return nil, err
	}

	out := make([]InventoryItem, 0, len(user.Inventory))
	for productID, quantity := range user.Inventory {
		if quantity <= 0 {
			continue
		}
		product, ok := s.store.productByIDLocked(productID)
		if !ok {
			continue
		}
		out = append(out, inventoryDTO(product, quantity))
	}
	return out, nil
}

func (s *InventoryService) FastSell(userID, productID string, quantity int) (int64, error) {
	if quantity <= 0 || quantity > 999 {
		return 0, ErrInvalidInput
	}

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	user, err := s.store.getUserLocked(userID)
	if err != nil {
		return 0, err
	}
	product, ok := s.store.productByIDLocked(productID)
	if !ok {
		return 0, ErrNotFound
	}
	if user.Inventory[productID] < quantity {
		return 0, ErrInsufficientStock
	}

	gained := fastSellPrice(product) * int64(quantity)
	user.Inventory[productID] -= quantity
	user.Coins += gained
	applyQuestProgress(user, "collect", int(gained/10))
	return gained, nil
}
