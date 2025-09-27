-- Remove index for billable column
DROP INDEX IF EXISTS idx_time_entries_billable;

-- Remove billable column from time_entries table
ALTER TABLE time_entries DROP COLUMN IF EXISTS billable;