# Project Plan - Quest Daily and Weekly Reset Logic

This plan details the implementation of a lazy reset mechanism for daily and weekly quests. Quests will be checked and reset automatically when a user retrieves their quest list, ensuring that they can repeat daily and weekly challenges.

## Overview
Currently, quests are assigned to users upon registration but are never reset. Once completed and claimed, they remain inactive forever. We will implement the following:
1. **Database Migration**:
   * Add `last_daily_quest_reset_at` and `last_weekly_quest_reset_at` timestamp columns to the `users` table.
   * Modify the check constraint on `quests.quest_type` to allow `'weekly'` quests.
   * Seed a default weekly quest (`WEEKLY_COLLECT_10`) and assign it to all existing users.
2. **Lazy Reset on Quest List Retrieval**:
   * In `QuestService.List(userID)`, start a transaction.
   * Retrieve the user's last reset times.
   * Check if a daily reset is needed (current date is different from `last_daily_quest_reset_at`). If so, reset all `'daily'` quests for the user and update `last_daily_quest_reset_at` to `now()`.
   * Check if a weekly reset is needed (current ISO week is different from `last_weekly_quest_reset_at`). If so, reset all `'weekly'` quests for the user and update `last_weekly_quest_reset_at` to `now()`.
   * Commit the transaction and return the updated quest list.

---

## Project Type
**BACKEND** (Go with PostgreSQL)

---

## Tech Stack
*   **Go 1.21+**
*   **PostgreSQL** (with pgx/sql driver)

---

## Success Criteria
* Daily quests reset progress to `0` and status to `'active'` when the user fetches quests on a new calendar day.
* Weekly quests reset progress to `0` and status to `'active'` when the user fetches quests in a new ISO week.
* A weekly quest (`WEEKLY_COLLECT_10`) is correctly seeded and available to all users.
* Reset actions are fully transactional, preventing race conditions or double claims.

---

## Proposed File Changes

### Backend Migrations

#### [NEW] [000012_quest_reset.up.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000012_quest_reset.up.sql)
*   Add columns `last_daily_quest_reset_at` and `last_weekly_quest_reset_at` to `users`.
*   Update `quests` check constraint to support `'weekly'` type.
*   Insert starter weekly quest `WEEKLY_COLLECT_10`.
*   Assign new weekly quest to existing users.

#### [NEW] [000012_quest_reset.down.sql](file:///c:/Users/dungv/hangrong/backend/migrations/000012_quest_reset.down.sql)
*   Roll back the columns, constraint changes, and seeded quest.

### Backend Go Services

#### [MODIFY] [quest_service.go](file:///c:/Users/dungv/hangrong/backend/internal/game/quest_service.go)
*   In `List`, fetch the reset timestamps, compare them with current time, perform resets for daily/weekly quests if dates/weeks differ, and update the timestamps accordingly within a transaction.

---

## Task Breakdown

### Task 1: Create SQL Migration for Quest Reset
*   **Description**: Create `000012_quest_reset.up.sql` and `000012_quest_reset.down.sql` migrations.
*   **Agent**: `database-architect`
*   **Input**: Database migrations folder
*   **Output**: Migration files created.

### Task 2: Implement Reset Logic in QuestService
*   **Description**: Modify `QuestService.List` to implement the transaction-backed lazy reset logic.
*   **Agent**: `backend-specialist`
*   **Input**: `quest_service.go`
*   **Output**: Updated `quest_service.go` with reset logic.

### Task 3: Apply Migrations & Verification
*   **Description**: Run migrations and run service tests to ensure everything is valid.
*   **Agent**: `backend-specialist`
*   **Input**: Backend codebase
*   **Output**: Migration successful and tests passing.

---

## Phase X: Verification

- [ ] Apply migrations: `./backend/scripts/apply-migrations.sh` or run SQL manually.
- [ ] Run backend tests: `cd backend && go test ./...`
- [ ] Manual check: verify no SQL errors on quest list fetching.
