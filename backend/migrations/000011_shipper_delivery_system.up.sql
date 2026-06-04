CREATE TABLE shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shipper_index INT NOT NULL CHECK (shipper_index >= 1 AND shipper_index <= 3),
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  status VARCHAR(16) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'delivering')),
  busy_until TIMESTAMPTZ DEFAULT NULL,
  capacity INT NOT NULL DEFAULT 10 CHECK (capacity > 0),
  slots INT NOT NULL DEFAULT 1 CHECK (slots >= 1 AND slots <= 3),
  speed_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (speed_multiplier >= 1.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, shipper_index)
);

CREATE INDEX idx_shippers_user_id ON shippers(user_id);

CREATE TRIGGER trg_shippers_updated_at
BEFORE UPDATE ON shippers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shipper_id UUID REFERENCES shippers(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  reward_coins BIGINT NOT NULL CHECK (reward_coins >= 0),
  reward_xp BIGINT NOT NULL CHECK (reward_xp >= 0),
  delivery_time_seconds INT NOT NULL DEFAULT 120 CHECK (delivery_time_seconds > 0),
  difficulty VARCHAR(16) NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivering')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_orders_user_id ON delivery_orders(user_id);
CREATE INDEX idx_delivery_orders_shipper_id ON delivery_orders(shipper_id);

CREATE TRIGGER trg_delivery_orders_updated_at
BEFORE UPDATE ON delivery_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
