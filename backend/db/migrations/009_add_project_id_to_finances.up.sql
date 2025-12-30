-- Add project_id column to finances table for linking with projects
ALTER TABLE finances 
ADD COLUMN project_id INT NULL COMMENT 'Link to project if this is project-related income/expense',
ADD COLUMN source VARCHAR(50) DEFAULT 'manual' COMMENT 'Source: manual or project',
ADD INDEX idx_project_id (project_id),
ADD INDEX idx_source (source);

-- Add foreign key constraint
ALTER TABLE finances
ADD CONSTRAINT fk_finances_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

