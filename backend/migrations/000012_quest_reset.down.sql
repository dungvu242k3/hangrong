DELETE FROM user_quests WHERE quest_id IN (SELECT id FROM quests WHERE code = 'WEEKLY_COLLECT_10');
DELETE FROM quests WHERE code = 'WEEKLY_COLLECT_10';

ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_quest_type_check;
ALTER TABLE quests ADD CONSTRAINT quests_quest_type_check CHECK (quest_type IN ('daily', 'main', 'event', 'tutorial'));

ALTER TABLE users DROP COLUMN IF EXISTS last_daily_quest_reset_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_weekly_quest_reset_at;
