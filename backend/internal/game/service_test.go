package game

import (
	"testing"
	"time"
)

func TestRegisterImportAndPlaceProduct(t *testing.T) {
	svc := NewService()

	tokens, err := svc.Register("tester", "tester@example.com", "123456")
	if err != nil {
		t.Fatalf("register: %v", err)
	}

	userID, ok := svc.UserIDForAccessToken(tokens.AccessToken)
	if !ok {
		t.Fatal("expected access token to resolve user")
	}

	order, balance, err := svc.CreateImportOrder(userID, "tra-da", 2)
	if err != nil {
		t.Fatalf("create import order: %v", err)
	}
	if order.Status != "pending" {
		t.Fatalf("expected pending order, got %q", order.Status)
	}
	if balance != 1150 {
		t.Fatalf("expected balance 1150, got %d", balance)
	}

	slot, err := svc.PlaceProduct(userID, "slot-1", "banh-mi")
	if err != nil {
		t.Fatalf("place product: %v", err)
	}
	if slot.ProductID == nil || *slot.ProductID != "banh-mi" {
		t.Fatalf("expected banh-mi in slot, got %#v", slot.ProductID)
	}
}

func TestCollectSlotRequiresReadyState(t *testing.T) {
	svc := NewService()

	tokens, err := svc.Register("collector", "collector@example.com", "123456")
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	userID, _ := svc.UserIDForAccessToken(tokens.AccessToken)

	if _, err := svc.PlaceProduct(userID, "slot-1", "banh-mi"); err != nil {
		t.Fatalf("place product: %v", err)
	}

	if _, _, err := svc.CollectSlot(userID, "slot-1"); err != ErrNotReady {
		t.Fatalf("expected ErrNotReady, got %v", err)
	}

	svc.Selling.store.mu.Lock()
	svc.Selling.store.users[userID].Slots["slot-1"].ReadyAt = time.Now().Add(-time.Second)
	svc.Selling.store.mu.Unlock()

	reward, balance, err := svc.CollectSlot(userID, "slot-1")
	if err != nil {
		t.Fatalf("collect ready slot: %v", err)
	}
	if reward != 90 || balance != 1290 {
		t.Fatalf("expected reward 90 and balance 1290, got reward=%d balance=%d", reward, balance)
	}
}
