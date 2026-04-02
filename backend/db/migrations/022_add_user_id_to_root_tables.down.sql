ALTER TABLE projects DROP INDEX IF EXISTS idx_projects_user_id;
ALTER TABLE projects DROP COLUMN IF EXISTS user_id;

ALTER TABLE finances DROP INDEX IF EXISTS idx_finances_user_id;
ALTER TABLE finances DROP COLUMN IF EXISTS user_id;

ALTER TABLE members DROP INDEX IF EXISTS idx_members_user_id;
ALTER TABLE members DROP COLUMN IF EXISTS user_id;

ALTER TABLE activities DROP INDEX IF EXISTS idx_activities_user_id;
ALTER TABLE activities DROP COLUMN IF EXISTS user_id;

ALTER TABLE customers DROP INDEX IF EXISTS idx_customers_user_id;
ALTER TABLE customers DROP COLUMN IF EXISTS user_id;

ALTER TABLE equipment DROP INDEX IF EXISTS idx_equipment_user_id;
ALTER TABLE equipment DROP COLUMN IF EXISTS user_id;

ALTER TABLE inventory_categories DROP INDEX IF EXISTS idx_inventory_categories_user_id;
ALTER TABLE inventory_categories DROP COLUMN IF EXISTS user_id;

ALTER TABLE invoices DROP INDEX IF EXISTS idx_invoices_user_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS user_id;

ALTER TABLE invoice_templates DROP INDEX IF EXISTS idx_invoice_templates_user_id;
ALTER TABLE invoice_templates DROP COLUMN IF EXISTS user_id;

ALTER TABLE item_templates DROP INDEX IF EXISTS idx_item_templates_user_id;
ALTER TABLE item_templates DROP COLUMN IF EXISTS user_id;

ALTER TABLE finance_category_models DROP INDEX IF EXISTS idx_finance_category_models_user_id;
ALTER TABLE finance_category_models DROP COLUMN IF EXISTS user_id;
