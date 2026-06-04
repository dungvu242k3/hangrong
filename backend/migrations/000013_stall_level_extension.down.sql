-- Revert levels 2 and 3 back to original costs
UPDATE upgrade_configs
SET cost_coins = 500
WHERE upgrade_type = 'stall' AND target_level = 2;

UPDATE upgrade_configs
SET cost_coins = 1000
WHERE upgrade_type = 'stall' AND target_level = 3;

-- Remove levels 4, 5, and 6
DELETE FROM upgrade_configs
WHERE upgrade_type = 'stall' AND target_level IN (4, 5, 6);
