-- Add billable column to time_entries table
ALTER TABLE time_entries ADD COLUMN billable BOOLEAN NOT NULL DEFAULT true;

-- Create index for billable column for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable);