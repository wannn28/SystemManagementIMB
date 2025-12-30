-- Add project_income_id and project_expense_id for bidirectional sync
ALTER TABLE finances 
ADD COLUMN project_income_id INT NULL COMMENT 'Link to project_incomes if synced from project income',
ADD COLUMN project_expense_id INT NULL COMMENT 'Link to project_expenses if synced from project expense',
ADD INDEX idx_project_income_id (project_income_id),
ADD INDEX idx_project_expense_id (project_expense_id);

-- Add foreign key constraints
ALTER TABLE finances
ADD CONSTRAINT fk_finances_project_income
FOREIGN KEY (project_income_id) REFERENCES project_incomes(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_finances_project_expense
FOREIGN KEY (project_expense_id) REFERENCES project_expenses(id) ON DELETE CASCADE;

-- Add finance_id to project_incomes for reverse sync
ALTER TABLE project_incomes
ADD COLUMN finance_id INT NULL COMMENT 'Link to finances if synced',
ADD INDEX idx_finance_id (finance_id);

ALTER TABLE project_incomes
ADD CONSTRAINT fk_project_incomes_finance
FOREIGN KEY (finance_id) REFERENCES finances(id) ON DELETE SET NULL;

-- Add finance_id to project_expenses for reverse sync
ALTER TABLE project_expenses
ADD COLUMN finance_id INT NULL COMMENT 'Link to finances if synced',
ADD INDEX idx_finance_id (finance_id);

ALTER TABLE project_expenses
ADD CONSTRAINT fk_project_expenses_finance
FOREIGN KEY (finance_id) REFERENCES finances(id) ON DELETE SET NULL;

