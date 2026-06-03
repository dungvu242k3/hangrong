CREATE TABLE upgrade_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_type VARCHAR(32) NOT NULL CHECK (upgrade_type IN ('stall', 'storage', 'tool')),
  target_level INT NOT NULL CHECK (target_level > 1),
  cost_coins BIGINT NOT NULL CHECK (cost_coins >= 0),
  cost_gems BIGINT NOT NULL DEFAULT 0 CHECK (cost_gems >= 0),
  effect JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(upgrade_type, target_level)
);

CREATE INDEX idx_upgrade_configs_type ON upgrade_configs(upgrade_type, target_level);

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  quest_type VARCHAR(24) NOT NULL CHECK (quest_type IN ('daily', 'main', 'event', 'tutorial')),
  target_type VARCHAR(64) NOT NULL,
  target_value INT NOT NULL CHECK (target_value > 0),
  reward JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quests_type_active ON quests(quest_type, is_active);
CREATE INDEX idx_quests_target_type ON quests(target_type);

CREATE TRIGGER trg_quests_updated_at
BEFORE UPDATE ON quests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'claimed', 'expired')),
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user_status ON user_quests(user_id, status);
CREATE INDEX idx_user_quests_user_created ON user_quests(user_id, created_at DESC);

CREATE TRIGGER trg_user_quests_updated_at
BEFORE UPDATE ON user_quests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO upgrade_configs (upgrade_type, target_level, cost_coins, effect)
VALUES
  ('stall', 2, 500, '{"slot_count": 4, "offline_limit_minutes": 45}'),
  ('stall', 3, 1000, '{"slot_count": 5, "offline_limit_minutes": 60}'),
  ('storage', 2, 400, '{"inventory_cap": 80}'),
  ('storage', 3, 900, '{"inventory_cap": 140}')
ON CONFLICT (upgrade_type, target_level) DO NOTHING;

INSERT INTO quests (code, title, description, quest_type, target_type, target_value, reward)
VALUES
  ('DAILY_IMPORT_3', 'Nhap hang dau ngay', 'Nhap 3 mon hang bat ky.', 'daily', 'IMPORT_PRODUCT', 3, '{"coins": 120, "gems": 0}'),
  ('DAILY_COLLECT_2', 'Thu tien ban hang', 'Thu tien tu sap 2 lan.', 'daily', 'COLLECT_REVENUE', 2, '{"coins": 180, "gems": 1}'),
  ('MAIN_UPGRADE_STALL', 'Nang cap sap', 'Nang cap sap hang len cap moi.', 'main', 'UPGRADE_STALL', 1, '{"coins": 300, "gems": 2}')
ON CONFLICT (code) DO NOTHING;
