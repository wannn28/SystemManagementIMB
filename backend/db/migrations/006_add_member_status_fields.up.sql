ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;

-- Create index for faster queries on active members
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);

