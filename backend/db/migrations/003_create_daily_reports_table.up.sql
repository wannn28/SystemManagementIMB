CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    date VARCHAR(10) NOT NULL,
    revenue DECIMAL(15,2) DEFAULT 0,
    paid DECIMAL(15,2) DEFAULT 0,
    volume DECIMAL(15,2) DEFAULT 0,
    target_volume DECIMAL(15,2) DEFAULT 0,
    plan DECIMAL(15,2) DEFAULT 0,
    aktual DECIMAL(15,2) DEFAULT 0,
    workers JSONB,
    equipment JSONB,
    total_workers INTEGER DEFAULT 0,
    total_equipment INTEGER DEFAULT 0,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date); 