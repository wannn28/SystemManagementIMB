-- Requires MySQL 8.0.12+ or MariaDB 10.5.2+ for IF NOT EXISTS on ADD COLUMN.
-- If this file fails, run 024_ensure_user_id_columns_mysql57.up.sql instead (idempotent).

ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE projects ADD INDEX IF NOT EXISTS idx_projects_user_id (user_id);

ALTER TABLE finances ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE finances ADD INDEX IF NOT EXISTS idx_finances_user_id (user_id);

ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE members ADD INDEX IF NOT EXISTS idx_members_user_id (user_id);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE activities ADD INDEX IF NOT EXISTS idx_activities_user_id (user_id);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customers_user_id (user_id);

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE equipment ADD INDEX IF NOT EXISTS idx_equipment_user_id (user_id);

ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE inventory_categories ADD INDEX IF NOT EXISTS idx_inventory_categories_user_id (user_id);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_invoices_user_id (user_id);

ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE invoice_templates ADD INDEX IF NOT EXISTS idx_invoice_templates_user_id (user_id);

ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE item_templates ADD INDEX IF NOT EXISTS idx_item_templates_user_id (user_id);

ALTER TABLE finance_category_models ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE finance_category_models ADD INDEX IF NOT EXISTS idx_finance_category_models_user_id (user_id);
