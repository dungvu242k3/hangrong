CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  event_type VARCHAR(32) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_events_active_time ON events(is_active, starts_at, ends_at);

CREATE TABLE event_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_progress_event_score
ON event_progress(event_id, score DESC);

CREATE TRIGGER trg_event_progress_updated_at
BEFORE UPDATE ON event_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  decoration_type VARCHAR(32) NOT NULL,
  rarity VARCHAR(24) NOT NULL DEFAULT 'common',
  price_coins BIGINT DEFAULT 0 CHECK (price_coins >= 0),
  price_gems BIGINT DEFAULT 0 CHECK (price_gems >= 0),
  image_url TEXT,
  effect JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decorations_type_active
ON decorations(decoration_type, is_active);

CREATE TABLE user_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decoration_id UUID NOT NULL REFERENCES decorations(id),
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, decoration_id)
);

CREATE INDEX idx_user_decorations_user ON user_decorations(user_id);

CREATE TABLE shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_type VARCHAR(32) NOT NULL,
  item_id UUID NOT NULL,
  price_coins BIGINT NOT NULL DEFAULT 0,
  price_gems BIGINT NOT NULL DEFAULT 0,
  request_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_purchases_user_created
ON shop_purchases(user_id, created_at DESC);

INSERT INTO decorations (code, name, decoration_type, rarity, price_coins, effect)
VALUES
  ('SIGN_BASIC', 'Bảng hiệu gỗ', 'sign', 'common', 100, '{"decoration_score": 5}'),
  ('CHAIR_PLASTIC_RED', 'Ghế nhựa đỏ', 'chair', 'common', 80, '{"decoration_score": 3}'),
  ('LIGHT_STRING', 'Dây đèn nhỏ', 'light', 'rare', 350, '{"decoration_score": 12}'),
  ('STALL_SKIN_BLUE_TARP', 'Bạt xanh vỉa hè', 'stall_skin', 'rare', 500, '{"decoration_score": 18}')
ON CONFLICT (code) DO NOTHING;
