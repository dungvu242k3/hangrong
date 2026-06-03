# Plan - Player Level Progression and Product Balance

This plan outlines changes to balance the level progression speed (making it slower/harder) and expand the product catalog with diverse Vietnamese street foods unlocked across spaced-out levels (up to Level 10).

## Proposed Changes

### 1. Backend Core & Progression

#### [MODIFY] [progression.go](file:///c:/Users/dungv/hangrong/backend/internal/game/progression.go)
* Modify `addXP` to use a quadratic scaling formula for `max_xp` increment:
  ```diff
  -	maxXP += 50
  +	maxXP += int64(level) * 100
  ```
  This creates a satisfying progression curve:
  * Level 1: 100 XP
  * Level 2: 300 XP
  * Level 3: 600 XP
  * Level 4: 1000 XP
  * Level 5: 1500 XP
  * Level 6: 2100 XP
  * Level 7: 2800 XP
  * Level 8: 3600 XP
  * Level 9: 4500 XP
  * Level 10: 5500 XP

#### [MODIFY] [selling_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/selling_service.go)
* Reduce the XP reward when harvesting ready-to-collect slots:
  ```diff
  -	_, _, _, err = addXP(tx, userID, 15)
  +	_, _, _, err = addXP(tx, userID, 8)
  ```

#### [MODIFY] [social_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/social_service.go)
* Reduce the XP reward when helping or pranking neighbors:
  ```diff
  -	gained := 10
  -	if action == "prank" {
  -		gained = 6
  -	}
  +	gained := 5
  +	if action == "prank" {
  +		gained = 3
  +	}
  ```

### 2. Database Schema & Seeds

#### [NEW] [000009_progression_balance.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000009_progression_balance.up.sql)
* Insert 6 new diverse products:
  * **Nem Chua Rán** (food, level 4, import: 180 xu, sell: 350 xu, duration: 80s)
  * **Sữa Yogurt Nếp Cẩm** (drink, level 5, import: 130 xu, sell: 270 xu, duration: 70s)
  * **Xôi Xéo** (food, level 6, import: 250 xu, sell: 520 xu, duration: 150s)
  * **Sấu Đá Phố Cổ** (drink, level 7, import: 100 xu, sell: 220 xu, duration: 60s)
  * **Bắp Nướng Mỡ Hành** (food, level 8, import: 300 xu, sell: 650 xu, duration: 180s)
  * **Phở Bánh Gánh** (food, level 10, import: 500 xu, sell: 1100 xu, duration: 240s)

#### [NEW] [000009_progression_balance.down.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000009_progression_balance.down.sql)
* Rollback script to clean up the added products.

### 3. Frontend Mock Fallback Configuration

#### [MODIFY] [import-goods/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/import-goods/page.tsx)
* Update `STREET_PRODUCTS` mock array to match the new database configurations so the offline fallback rendering maps correctly.

---

## Verification Plan

### Automated Tests
* Run unit and integration tests to verify database migrations and user updates:
  ```powershell
  go test -v ./internal/game/...
  npx tsc --noEmit
  ```

### Manual Verification
1. Run `docker compose down -v` and `docker compose up --build` to re-seed the catalog.
2. Verify in the **Nhập Hàng** page that all 12 items are visible, with the locked cards displaying "Cấp X Mở khóa" up to Cấp 10.
3. Place a Bánh Mì, harvest it, and verify that the player balance increases but XP increases by only 8 (instead of 15).
4. Verify that leveling up now requires progressively more XP.
