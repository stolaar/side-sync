-- Drop settings table
DROP TABLE IF EXISTS settings;

-- Remove hourly_rate column from projects table
ALTER TABLE projects DROP COLUMN IF EXISTS hourly_rate;