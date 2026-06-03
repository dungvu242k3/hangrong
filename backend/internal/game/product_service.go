package game

type ProductService struct {
	store *Store
}

func NewProductService(store *Store) *ProductService {
	return &ProductService{store: store}
}

func (s *ProductService) UnlockedProducts(userID string) []Product {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	level := 1
	if user, ok := s.store.users[userID]; ok {
		level = user.Level
	}

	out := make([]Product, 0, len(s.store.products))
	for _, product := range s.store.products {
		if product.LevelRequired <= level {
			out = append(out, product)
		}
	}
	return out
}
