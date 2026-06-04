-- Update existing levels 2 and 3 to align with frontend cost formula (level * 1000)
UPDATE upgrade_configs
SET cost_coins = 1000
WHERE upgrade_type = 'stall' AND target_level = 2;

UPDATE upgrade_configs
SET cost_coins = 2000
WHERE upgrade_type = 'stall' AND target_level = 3;

-- Insert new levels 4, 5, and 6
INSERT INTO upgrade_configs (upgrade_type, target_level, cost_coins, effect)
VALUES
  ('stall', 4, 3000, '{"slot_count": 6, "offline_limit_minutes": 75}'),
  ('stall', 5, 4000, '{"slot_count": 7, "offline_limit_minutes": 90}'),
  ('stall', 6, 5000, '{"slot_count": 8, "offline_limit_minutes": 120}')
ON CONFLICT (upgrade_type, target_level) DO UPDATE
SET cost_coins = EXCLUDED.cost_coins, effect = EXCLUDED.effect;
