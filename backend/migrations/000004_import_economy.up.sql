CREATE TABLE import_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  total_cost BIGINT NOT NULL CHECK (total_cost >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'cancelled', 'expired')),
  request_id UUID UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  CHECK (completed_at > started_at)
);

CREATE INDEX idx_import_orders_user_status ON import_orders(user_id, status);
CREATE INDEX idx_import_orders_completed ON import_orders(completed_at)
WHERE status = 'pending';
CREATE INDEX idx_import_orders_user_created ON import_orders(user_id, started_at DESC);

CREATE TABLE currency_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  currency_type VARCHAR(16) NOT NULL CHECK (currency_type IN ('coins', 'gems')),
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  reason VARCHAR(64) NOT NULL,
  request_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_currency_ledger_request_id
ON currency_ledger(request_id)
WHERE request_id IS NOT NULL;

CREATE INDEX idx_currency_ledger_user_created
ON currency_ledger(user_id, created_at DESC);

CREATE INDEX idx_currency_ledger_reason_created
ON currency_ledger(reason, created_at DESC);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  request_id UUID NOT NULL,
  endpoint VARCHAR(128) NOT NULL,
  response_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, request_id, endpoint)
);

CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at);
