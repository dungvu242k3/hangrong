CREATE TABLE stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL DEFAULT 'Ganh hang nho',
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  storage_level INT NOT NULL DEFAULT 1 CHECK (storage_level >= 1),
  cleanliness INT NOT NULL DEFAULT 100 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  decoration_score INT NOT NULL DEFAULT 0 CHECK (decoration_score >= 0),
  auto_collect_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (auto_collect_rate >= 0 AND auto_collect_rate <= 100),
  offline_limit_minutes INT NOT NULL DEFAULT 30 CHECK (offline_limit_minutes >= 0),
  location_code VARCHAR(64) NOT NULL DEFAULT 'SCHOOL_GATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stalls_user ON stalls(user_id);
CREATE INDEX idx_stalls_location ON stalls(location_code);
CREATE INDEX idx_stalls_level ON stalls(level);

CREATE TRIGGER trg_stalls_updated_at
BEFORE UPDATE ON stalls
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE stall_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index > 0),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  pending_revenue BIGINT NOT NULL DEFAULT 0 CHECK (pending_revenue >= 0),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(16) NOT NULL DEFAULT 'empty'
    CHECK (status IN ('empty', 'selling', 'paused', 'locked')),
  UNIQUE(stall_id, slot_index),
  CHECK (
    (status = 'empty' AND product_id IS NULL AND quantity = 0)
    OR status <> 'empty'
  )
);

CREATE INDEX idx_stall_slots_stall ON stall_slots(stall_id);
CREATE INDEX idx_stall_slots_status ON stall_slots(status);
CREATE INDEX idx_stall_slots_product ON stall_slots(product_id);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  slot_id UUID REFERENCES stall_slots(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  revenue BIGINT NOT NULL CHECK (revenue >= 0),
  profit BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_user_created ON sales(user_id, created_at DESC);
CREATE INDEX idx_sales_product_created ON sales(product_id, created_at DESC);
