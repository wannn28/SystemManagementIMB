-- Add unit column to salary_details so each line can be Jam, Trip, or Hari.
-- Existing rows default to Jam (hours) so hour-based slips keep working.

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'salary_details'
     AND COLUMN_NAME = 'unit') > 0,
  'SELECT 1',
  'ALTER TABLE salary_details ADD COLUMN unit VARCHAR(10) NOT NULL DEFAULT ''Jam'' COMMENT ''Quantity unit: Jam, Trip, or Hari'''
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
