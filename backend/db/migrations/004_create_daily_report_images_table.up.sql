CREATE TABLE daily_report_images (
    id SERIAL PRIMARY KEY,
    report_daily_id INTEGER NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    description TEXT,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (report_daily_id) REFERENCES daily_reports(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_daily_report_images_report_daily_id ON daily_report_images(report_daily_id); 