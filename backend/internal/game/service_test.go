package game

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"hangrong/backend/internal/config"
)

func getTestDB(t *testing.T) *sql.DB {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		cfg := config.Load()
		dbURL = cfg.DatabaseURL
	}
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping database integration tests")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Skipf("cannot connect to database: %v, skipping database integration tests", err)
	}

	return db
}

func TestRegisterImportAndPlaceProduct(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	svc := NewService(db)

	username := fmt.Sprintf("tester_%d", time.Now().UnixNano())
	tokens, err := svc.Register(username, username+"@example.com", "123456")
	if err != nil {
		t.Fatalf("register: %v", err)
	}

	userID, ok := svc.UserIDForAccessToken(tokens.AccessToken)
	if !ok {
		t.Fatal("expected access token to resolve user")
	}

	// Fetch product IDs
	var traDaID string
	err = db.QueryRow("SELECT id FROM products WHERE code = 'TRA_DA'").Scan(&traDaID)
	if err != nil {
		t.Fatalf("get TRA_DA product id: %v", err)
	}

	var banhMiID string
	err = db.QueryRow("SELECT id FROM products WHERE code = 'BANH_MI'").Scan(&banhMiID)
	if err != nil {
		t.Fatalf("get BANH_MI product id: %v", err)
	}

	order, balance, err := svc.CreateImportOrder(userID, traDaID, 2)
	if err != nil {
		t.Fatalf("create import order: %v", err)
	}
	if order.Status != "pending" {
		t.Fatalf("expected pending order, got %q", order.Status)
	}
	if balance != 1150 { // 1200 - 2 * 25
		t.Fatalf("expected balance 1150, got %d", balance)
	}

	slot, err := svc.PlaceProduct(userID, "slot1", banhMiID)
	if err != nil {
		t.Fatalf("place product: %v", err)
	}
	if slot.ProductID == nil || *slot.ProductID != banhMiID {
		t.Fatalf("expected banh-mi in slot, got %#v", slot.ProductID)
	}
}

func TestCollectSlotRequiresReadyState(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	svc := NewService(db)

	username := fmt.Sprintf("collector_%d", time.Now().UnixNano())
	tokens, err := svc.Register(username, username+"@example.com", "123456")
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	userID, _ := svc.UserIDForAccessToken(tokens.AccessToken)

	var banhMiID string
	err = db.QueryRow("SELECT id FROM products WHERE code = 'BANH_MI'").Scan(&banhMiID)
	if err != nil {
		t.Fatalf("get BANH_MI product id: %v", err)
	}

	if _, err := svc.PlaceProduct(userID, "slot1", banhMiID); err != nil {
		t.Fatalf("place product: %v", err)
	}

	if _, _, err := svc.CollectSlot(userID, "slot1"); !errors.Is(err, ErrNotReady) {
		t.Fatalf("expected ErrNotReady, got %v", err)
	}

	// Update last_synced_at to 30 seconds ago to make slot ready (Banh mi takes 20 seconds)
	var stallID string
	err = db.QueryRow("SELECT id FROM stalls WHERE user_id = $1", userID).Scan(&stallID)
	if err != nil {
		t.Fatalf("get stall id: %v", err)
	}
	_, err = db.Exec("UPDATE stall_slots SET last_synced_at = now() - interval '30 seconds' WHERE stall_id = $1 AND slot_index = 1", stallID)
	if err != nil {
		t.Fatalf("update slot time: %v", err)
	}

	reward, balance, err := svc.CollectSlot(userID, "slot1")
	if err != nil {
		t.Fatalf("collect ready slot: %v", err)
	}
	if reward != 90 || balance != 1290 { // 1200 coins starter + 90 reward
		t.Fatalf("expected reward 90 and balance 1290, got reward=%d balance=%d", reward, balance)
	}
}

