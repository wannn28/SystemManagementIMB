ALTER TABLE daily_reports
    DROP COLUMN IF EXISTS ritase,
    DROP COLUMN IF EXISTS cuaca,
    DROP COLUMN IF EXISTS catatan;
