CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL CHECK (category IN ('food', 'drink', 'toy')),
  unlock_level INT NOT NULL DEFAULT 1 CHECK (unlock_level >= 1),
  import_price BIGINT NOT NULL CHECK (import_price >= 0),
  sell_price BIGINT NOT NULL CHECK (sell_price >= 0),
  import_duration_seconds INT NOT NULL CHECK (import_duration_seconds > 0),
  base_sell_duration_seconds INT NOT NULL CHECK (base_sell_duration_seconds > 0),
  icon_name VARCHAR(64) NOT NULL DEFAULT 'package',
  color VARCHAR(16) NOT NULL DEFAULT '#64748B',
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_unlock_level ON products(unlock_level);
CREATE INDEX idx_products_category ON products(category);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);

CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO products
  (code, name, category, unlock_level, import_price, sell_price, import_duration_seconds, base_sell_duration_seconds, icon_name, color)
VALUES
  ('BANH_MI', 'Bánh mì', 'food', 1, 50, 90, 20, 20, 'sandwich', '#F97316'),
  ('TRA_DA', 'Trà đá', 'drink', 1, 25, 45, 15, 15, 'cup-soda', '#14B8A6'),
  ('HUONG_DUONG', 'Hướng dương', 'food', 1, 35, 60, 25, 25, 'flower', '#EAB308'),
  ('BANH_CUON', 'Bánh cuốn', 'food', 2, 85, 140, 35, 35, 'scroll', '#A855F7'),
  ('TAU_HU', 'Tàu hũ nóng', 'drink', 2, 70, 120, 30, 30, 'soup', '#F43F5E'),
  ('TO_HE', 'Tò he', 'toy', 3, 120, 210, 45, 45, 'toy-brick', '#22C55E')
ON CONFLICT (code) DO NOTHING;
