ALTER TABLE members 
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS deactivation_reason,
DROP COLUMN IF EXISTS deactivated_at;

DROP INDEX IF EXISTS idx_members_is_active;

