# Project Plan - Admin Player Management Dashboard

This plan outlines the design and implementation for an unauthenticated admin dashboard page (`/dashboard`) and associated backend API endpoints to view, edit (coins, gems, level), and completely delete player accounts.

## Overview
We will implement an admin dashboard accessible at `/dashboard` that does not require login. This dashboard allows monitoring and managing the game's players:
1. **Backend Endpoints**:
   * `GET /api/admin/players`: Returns a list of all player profiles along with their wallet stats.
   * `PUT /api/admin/players/{id}`: Modifies a player's `coins` (xu), `gems` (ngọc), and `level` (cấp độ).
   * `DELETE /api/admin/players/{id}`: Deletes a player and all their associated game data (wallets, stalls, inventory, history, etc.) in a transaction.
2. **Frontend UI Page**:
   * A premium Dark Mode dashboard at `/dashboard`.
   * Displays stats summary at the top (Total Players, Total Coins, Total Gems, Average Level).
   * Interactive table listing players with search/filter capabilities.
   * "Edit Stats" modal to modify Coins, Gems, and Level.
   * "Delete Account" confirmation dialog.

---

## Project Type
**WEB** & **BACKEND** (Next.js and Go API)

---

## Tech Stack
*   **Go** for backend endpoints and DB integration
*   **React / Next.js (App Router)** for dashboard UI
*   **Tailwind CSS** or **Vanilla CSS** (matching frontend styling guidelines)

---

## Success Criteria
* `/dashboard` route is fully accessible and renders a premium dark-themed dashboard.
* Admin endpoints are functional and successfully return, update, or delete users.
* Deleting a user successfully deletes their records from all dependent tables (`sales`, `currency_ledger`, `idempotency_keys`, `neighbor_actions`, `security_events`, `shop_purchases`, `users`, etc.) without foreign key violations.
* Edit action correctly validates and updates player level, coins, and gems.
* Clean code and zero compilation errors.

---

## Proposed File Changes

### Backend Database & Services

#### [NEW] [admin_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/admin_service.go)
*   Define `AdminService` struct.
*   Implement `ListPlayers()` returning players list.
*   Implement `UpdatePlayer(id, coins, gems, level)` updating wallet and level.
*   Implement `DeletePlayer(id)` deleting references from dependent tables and the user row inside a single transaction.

#### [MODIFY] [models.go](file:///c:/Users/dungv/hangrong/backend/internal/game/models.go)
*   Define `AdminPlayer` struct.

#### [MODIFY] [service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/service.go)
*   Inject `AdminService` into `Service`.

#### [MODIFY] [handler.go](file:///c:/Users/dungv/hangrong/backend/internal/game/handler.go)
*   Register `/api/admin/players` routes (GET, PUT, DELETE).
*   Implement corresponding handler functions.

### Frontend Client

#### [NEW] [page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/dashboard/page.tsx)
*   Create `/dashboard` page using React/Next.js.
*   Implement premium Dark Mode dashboard.
*   Integrate player lists, stats overview, edit modal, search bar, and delete confirmations.

---

## Task Breakdown

### Task 1: Implement Backend Models and Service Logic
*   **Description**: Add `AdminPlayer` model, create `admin_service.go`, integrate into `service.go`.
*   **Agent**: `backend-specialist`

### Task 2: Implement Handler Endpoints
*   **Description**: Register routes and handlers in `handler.go`.
*   **Agent**: `backend-specialist`

### Task 3: Implement Dashboard Page in Next.js
*   **Description**: Create a dark mode dashboard page with stats cards, player table, and modals in `frontend/src/app/dashboard/page.tsx`.
*   **Agent**: `frontend-specialist`

### Task 4: Compilation and Verification
*   **Description**: Compile, run migrations/seeds if needed, run unit tests, check client compilation.
*   **Agent**: `test-engineer`

---

## Phase X: Verification

- [ ] Backend tests passing: `cd backend && go test ./...`
- [ ] Frontend type check passing: `cd frontend && npx tsc --noEmit`
- [ ] Manual test: View dashboard, search, edit stats, delete a player. Verify data updates in DB.
