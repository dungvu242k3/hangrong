# Hang Rong Backend

Go API server for the Hang Rong frontend. The backend is organized as a modular monolith: one deployable API binary, clear domain service boundaries.

## Run

```bash
cd backend
go run ./cmd/api
```

The server listens on `http://localhost:8080` by default.

Local env is loaded automatically from `backend/.env` when running from the repo root, or `.env` when running inside `backend/`.

Environment variables:

```bash
HR_ADDR=:8080
HR_ALLOWED_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/hangrong?sslmode=disable
PGHOST=localhost
PGPORT=5432
PGDATABASE=hangrong
PGUSER=postgres
PGPASSWORD=YOUR_POSTGRES_PASSWORD
HR_REQUEST_TIMEOUT=5s
HR_READ_TIMEOUT=5s
HR_WRITE_TIMEOUT=10s
HR_IDLE_TIMEOUT=60s
HR_SHUTDOWN_TIMEOUT=10s
```

The API server uses read/write/idle timeouts and graceful shutdown.

## Demo Account

```text
username: demo
password: 123456
```

## Current Scope

This is a runnable backend using an in-memory store behind domain services. The store boundary is intentionally isolated so it can be replaced by PostgreSQL/sqlc repositories without changing the frontend contract.

Database schema and FE/BE mapping are documented in [DATABASE.md](DATABASE.md). SQL migrations live in [migrations](migrations).
Security notes are documented in [SECURITY.md](SECURITY.md).

Apply local PostgreSQL migrations after filling `backend/.env`:

```powershell
.\backend\scripts\apply-migrations.ps1
```

Domain services:

```text
AuthService        register, login, refresh, access token lookup
PlayerService      player profile DTO
ProductService     unlocked product catalog
ImportOrderService import order create/claim/list
InventoryService   inventory list and fast sell
SellingService     stall slot place/collect/sync
StallService       stall upgrade and slot unlock
QuestService       quest list and reward claim
SocialService      friends and neighbor actions
```

Runtime/platform layers:

```text
cmd/api            API process bootstrap and graceful shutdown
internal/server    HTTP router, CORS, rate limit, recovery, access logs
internal/shared    API response envelope and JSON helpers
internal/config    environment-backed runtime config
```

Implemented frontend contracts:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/player/profile
GET  /api/products
GET  /api/import-orders
POST /api/import
POST /api/import-orders/{id}/claim
GET  /api/inventory
POST /api/inventory/sell
GET  /api/selling/slots
POST /api/selling/slots/{id}/place
POST /api/selling/slots/{id}/collect
POST /api/stalls/upgrade
GET  /api/quests
POST /api/quests/{id}/claim
GET  /api/friends
GET  /api/neighbors/{id}
POST /api/neighbors/{id}/help
POST /api/neighbors/{id}/prank
```

Health checks:

```text
GET /healthz
GET /readyz
```

## Tests

```bash
cd backend
go test ./...
```

## Next Production Hardening

The next backend milestones before real production traffic:

```text
PostgreSQL + sqlc repositories
wallet ledger table
idempotency table for money/inventory actions
Redis rate limit and cooldown backend
refresh token persistence/revocation
structured logger with request_id/user_id
OpenAPI contract
Dockerfile and CI gate
```
