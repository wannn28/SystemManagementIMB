-- Remove foreign keys and columns from project_expenses
ALTER TABLE project_expenses
DROP FOREIGN KEY IF EXISTS fk_project_expenses_finance;

ALTER TABLE project_expenses
DROP INDEX IF EXISTS idx_finance_id,
DROP COLUMN IF EXISTS finance_id;

-- Remove foreign keys and columns from project_incomes
ALTER TABLE project_incomes
DROP FOREIGN KEY IF EXISTS fk_project_incomes_finance;

ALTER TABLE project_incomes
DROP INDEX IF EXISTS idx_finance_id,
DROP COLUMN IF EXISTS finance_id;

-- Remove foreign keys and columns from finances
ALTER TABLE finances
DROP FOREIGN KEY IF EXISTS fk_finances_project_income,
DROP FOREIGN KEY IF EXISTS fk_finances_project_expense;

ALTER TABLE finances
DROP INDEX IF EXISTS idx_project_income_id,
DROP INDEX IF EXISTS idx_project_expense_id,
DROP COLUMN IF EXISTS project_income_id,
DROP COLUMN IF EXISTS project_expense_id;

