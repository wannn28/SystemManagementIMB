-- Remove project_id column from finances table
ALTER TABLE finances
DROP FOREIGN KEY IF EXISTS fk_finances_project;

ALTER TABLE finances
DROP INDEX IF EXISTS idx_project_id,
DROP INDEX IF EXISTS idx_source,
DROP COLUMN IF EXISTS project_id,
DROP COLUMN IF EXISTS source;

