package game

import "database/sql"

type Service struct {
	Auth         *AuthService
	Player       *PlayerService
	Product      *ProductService
	ImportOrder  *ImportOrderService
	InventorySvc *InventoryService
	Selling      *SellingService
	Stall        *StallService
	Quest        *QuestService
	Social       *SocialService
	Delivery     *DeliveryService
}

func NewService(db *sql.DB) *Service {
	svc := &Service{
		Auth:         NewAuthService(db),
		Player:       NewPlayerService(db),
		Product:      NewProductService(db),
		ImportOrder:  NewImportOrderService(db),
		InventorySvc: NewInventoryService(db),
		Selling:      NewSellingService(db),
		Stall:        NewStallService(db),
		Quest:        NewQuestService(db),
		Social:       NewSocialService(db),
		Delivery:     NewDeliveryService(db),
	}
	return svc
}

func (s *Service) Register(username, email, password string) (AuthTokens, error) {
	return s.Auth.Register(username, email, password)
}

func (s *Service) Login(username, password string) (AuthTokens, error) {
	return s.Auth.Login(username, password)
}

func (s *Service) Refresh(refreshToken string) (AuthTokens, error) {
	return s.Auth.Refresh(refreshToken)
}

func (s *Service) UserIDForAccessToken(token string) (string, bool) {
	return s.Auth.UserIDForAccessToken(token)
}

func (s *Service) Profile(userID string) (UserProfile, error) {
	return s.Player.Profile(userID)
}

func (s *Service) Products(userID string) []Product {
	return s.Product.UnlockedProducts(userID)
}

func (s *Service) ImportOrders(userID string) ([]ImportOrder, error) {
	return s.ImportOrder.ActiveOrders(userID)
}

func (s *Service) CreateImportOrder(userID, productID string, quantity int) (ImportOrder, int64, error) {
	return s.ImportOrder.Create(userID, productID, quantity)
}

func (s *Service) ClaimImportOrder(userID, orderID string) error {
	return s.ImportOrder.Claim(userID, orderID)
}

func (s *Service) InventoryItems(userID string) ([]InventoryItem, error) {
	return s.InventorySvc.List(userID)
}

func (s *Service) Inventory(userID string) ([]InventoryItem, error) {
	return s.InventoryItems(userID)
}

func (s *Service) FastSell(userID, productID string, quantity int) (int64, error) {
	return s.InventorySvc.FastSell(userID, productID, quantity)
}

func (s *Service) Slots(userID string) ([]StallSlot, error) {
	return s.Selling.Slots(userID)
}

func (s *Service) PlaceProduct(userID, slotID, productID string) (StallSlot, error) {
	return s.Selling.PlaceProduct(userID, slotID, productID)
}

func (s *Service) CollectSlot(userID, slotID string) (int64, int64, error) {
	return s.Selling.CollectSlot(userID, slotID)
}

func (s *Service) UpgradeStall(userID string) (int, int64, error) {
	return s.Stall.Upgrade(userID)
}

func (s *Service) Quests(userID string) ([]Quest, error) {
	return s.Quest.List(userID)
}

func (s *Service) ClaimQuest(userID, questID string) (int64, int64, error) {
	return s.Quest.Claim(userID, questID)
}

func (s *Service) Friends() []Friend {
	return s.Social.Friends()
}

func (s *Service) NeighborSlots(neighborID string) ([]StallSlot, error) {
	return s.Social.NeighborSlots(neighborID)
}

func (s *Service) NeighborAction(userID, neighborID, action string) (int, error) {
	return s.Social.NeighborAction(userID, neighborID, action)
}

func (s *Service) Shippers(userID string) ([]Shipper, error) {
	return s.Delivery.Shippers(userID)
}

func (s *Service) DeliveryOrders(userID string) ([]DeliveryOrder, error) {
	return s.Delivery.ActiveOrders(userID)
}

func (s *Service) DeliverOrders(userID, shipperID string, orderIDs []string) error {
	return s.Delivery.Deliver(userID, shipperID, orderIDs)
}

func (s *Service) ClaimShipper(userID, shipperID string) (int64, int64, int, int64, int64, error) {
	return s.Delivery.ClaimReward(userID, shipperID)
}

func (s *Service) UpgradeShipper(userID, shipperID string) (Shipper, int64, error) {
	return s.Delivery.UpgradeShipper(userID, shipperID)
}

func (s *Service) InstantCompleteShipper(userID, shipperID string) (int64, error) {
	return s.Delivery.InstantComplete(userID, shipperID)
}
