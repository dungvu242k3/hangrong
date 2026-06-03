# Plan - Expand Catalog with 100 Products up to Level 300

This plan outlines the generation and seeding of 100 diverse street food products unlocked evenly up to Level 300, with reasonable pricing and quick waiting times.

## Proposed Changes

### 1. Catalog Generation Script
We will implement a Python script `backend/scripts/generate_catalog.py` to automate the generation of:
1. SQL migration files (`000010_hundred_products.up.sql` and `000010_hundred_products.down.sql`).
2. Frontend configuration records for `PRODUCTS_CONFIG` in `frontend/src/shared/config/products.ts`.
3. Fallback arrays in `frontend/src/app/import-goods/page.tsx` and `frontend/src/app/stall/page.tsx`.

This script will combine a list of 100 foods from various regions with standard categories (`food`, `drink`, `toy`), assign unlock levels evenly (step of ~2.9 levels, ending at level 300), calculate balanced import/sell prices, and keep countdown times under 5.5 minutes.

### 2. Database Migrations

#### [NEW] [000010_hundred_products.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000010_hundred_products.up.sql)
* Inserts 100 generated products.

#### [NEW] [000010_hundred_products.down.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000010_hundred_products.down.sql)
* Deletes 100 generated products.

### 3. Frontend Configurations

#### [MODIFY] [products.ts](file:///c:/Users/dungv/hangrong/frontend/src/shared/config/products.ts)
* Append the 100 generated visual config records (emojis, Tailwind colors, descriptions) to `PRODUCTS_CONFIG`.

#### [MODIFY] [import-goods/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/import-goods/page.tsx)
* Synchronize the `STREET_PRODUCTS` mock fallback data array.

#### [MODIFY] [stall/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx)
* Synchronize `getProductDuration` durations and `FALLBACK_INVENTORY`.

---

## Balancing Algorithm Formulas
For item $i$ (from 1 to 100):
* **Unlock Level:** $Level = 10 + \lfloor 2.9 \times i \rfloor$ (ends at Level 300)
* **Import Price (Coins):** $importPrice = 500 + 150 \times i$ (ends at 15,500 xu)
* **Retail Sell Price (Coins):** $sellPrice = importPrice + 120 + 80 \times i$ (profit starts at 200 xu, goes up to 8,120 xu)
* **Countdown Duration (Seconds):** $duration = 30 + 3 \times i$ (starts at 33 seconds, ends at 330 seconds / 5.5 minutes max)

---

## Verification Plan

### Automated Tests
* Validate database syntax and compilation:
  ```powershell
  go test -v ./internal/game/...
  npx tsc --noEmit
  ```

### Manual Verification
1. Run the Python generator script to build files.
2. Spin up containers: `docker compose down -v` and `docker compose up --build`.
3. Check the **Nhập Hàng** catalog and verify the smooth scroll of 100+ items with locks extending up to Level 300.
4. Verify that import and sale operations succeed cleanly.
