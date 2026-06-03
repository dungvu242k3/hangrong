# Hang Rong Database Contract

This schema is designed for PostgreSQL as the source of truth and Redis as an acceleration layer only.

## Migration Layout

```text
000001_core_identity       users, auth_sessions, user_wallets
000002_catalog_inventory   products, inventory, product seed data
000003_stall_selling       stalls, stall_slots, sales
000004_import_economy      import_orders, currency_ledger, idempotency_keys
000005_progression         upgrade_configs, quests, user_quests
000006_social_notifications friends, neighbor_actions, notifications
000007_liveops_shop        events, event_progress, decorations, purchases
000008_security_admin      security_events, admin_actions
```

## Frontend DTO Mapping

The frontend contract stays camelCase. PostgreSQL stays snake_case.

```text
UserProfile
  users.id                  -> id
  users.username            -> username
  users.email               -> email
  user_wallets.coins        -> coins
  user_wallets.gems         -> gems
  users.level               -> level
  users.current_xp          -> currentXp
  users.max_xp              -> maxXp

Product
  products.id               -> id
  products.name             -> name
  products.category         -> category
  products.import_price     -> importPrice
  products.sell_price       -> sellPrice
  products.import_duration_seconds -> timeSeconds
  products.unlock_level     -> levelRequired
  products.icon_name        -> iconName
  products.color            -> color

ImportOrder
  import_orders.id          -> id
  import_orders.product_id  -> productId
  products.name             -> name
  import_orders.quantity    -> quantity
  completed_at - now()      -> timeRemaining
  completed_at - started_at -> totalTime
  import_orders.status      -> status

InventoryItem
  inventory.id              -> id
  inventory.product_id      -> productId
  products.name             -> name
  products.category         -> category
  inventory.quantity        -> quantity
  products.sell_price       -> sellPrice
  computed fast sell price  -> fastSellPrice
  products.icon_name        -> iconName
  products.color            -> color

StallSlot
  stall_slots.id            -> id
  stall_slots.product_id    -> productId
  products.name             -> productName
  products.icon_name        -> productIcon
  timestamp calculation     -> timeRemaining
  products.base_sell_duration_seconds -> totalTime
  pending_revenue > 0       -> isReadyToCollect
  stall_slots.pending_revenue -> coinsReward
```

Product IDs returned to FE are UUID strings once PostgreSQL repositories are implemented. `products.code` remains the stable admin/seed identifier, for example `BANH_MI` or `TRA_DA`.

## FE Mutation Contract Gap

The current frontend can already work with the MVP in-memory backend, but production money/inventory actions should include a `requestId` UUID so the backend can enforce idempotency.

Recommended payloads:

```json
{
  "productId": "uuid",
  "quantity": 3,
  "requestId": "uuid"
}
```

```json
{
  "productId": "uuid",
  "requestId": "uuid"
}
```

Endpoints that should require `requestId` before production:

```text
POST /api/import
POST /api/import-orders/{id}/claim
POST /api/inventory/sell
POST /api/selling/slots/{id}/place
POST /api/selling/slots/{id}/collect
POST /api/stalls/upgrade
POST /api/quests/{id}/claim
POST /api/neighbors/{id}/help
POST /api/neighbors/{id}/prank
```

## Core Transaction Boundaries

```text
Register
  users
  user_wallets
  stalls
  stall_slots
  user_quests

Create import order
  idempotency_keys
  products
  users
  user_wallets FOR UPDATE
  currency_ledger
  import_orders

Claim import order
  import_orders FOR UPDATE
  inventory upsert

Place product
  stalls ownership check
  inventory FOR UPDATE
  stall_slots FOR UPDATE

Collect revenue
  idempotency_keys
  stall_slots FOR UPDATE
  user_wallets FOR UPDATE
  currency_ledger
  sales
  user_quests

Quest reward
  user_quests FOR UPDATE
  user_wallets FOR UPDATE
  currency_ledger
```

## Redis Responsibilities

Redis should not hold canonical money, inventory, order, sale, or quest-reward state.

```text
cache:products:v1
cache:upgrade-config:v1
cache:quests:daily:v1
cache:events:current
cache:public-stall:{userId}

rl:ip:{ip}:login
rl:user:{userId}:collect
rl:user:{userId}:import

cooldown:prank:{fromUserId}:{toUserId}
daily:help:{userId}:{yyyy-mm-dd}

leaderboard:daily:{yyyy-mm-dd}
leaderboard:event:{eventId}
```

## Production Notes

The current Go code still uses an in-memory store. These migrations define the PostgreSQL target that should replace `internal/game/store.go` via repository implementations.

Recommended next implementation step:

```text
internal/platform/postgres
internal/platform/redis
internal/modules/* repositories
sqlc query files
wallet service with ledger-enforced mutations
idempotency service for every money/inventory action
```
