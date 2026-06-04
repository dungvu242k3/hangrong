ALTER TABLE users ADD COLUMN last_daily_quest_reset_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN last_weekly_quest_reset_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Recreate check constraint to allow 'weekly'
ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_quest_type_check;
ALTER TABLE quests ADD CONSTRAINT quests_quest_type_check CHECK (quest_type IN ('daily', 'weekly', 'main', 'event', 'tutorial'));

-- Insert new weekly quest
INSERT INTO quests (code, title, description, quest_type, target_type, target_value, reward)
VALUES
  ('WEEKLY_COLLECT_10', 'Thương nhân chăm chỉ', 'Thu tiền từ sạp 10 lần.', 'weekly', 'COLLECT_REVENUE', 10, '{"coins": 500, "gems": 5}')
ON CONFLICT (code) DO NOTHING;

-- Populate weekly quest for existing users
INSERT INTO user_quests (user_id, quest_id)
SELECT u.id, q.id
FROM users u
CROSS JOIN quests q
WHERE q.code = 'WEEKLY_COLLECT_10'
ON CONFLICT (user_id, quest_id) DO NOTHING;
