-- Drop indexes
DROP INDEX IF EXISTS idx_time_entries_start_time;
DROP INDEX IF EXISTS idx_time_entries_user_id;
DROP INDEX IF EXISTS idx_time_entries_project_id;
DROP INDEX IF EXISTS idx_projects_user_id;

-- Drop tables in reverse order due to foreign key constraints
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;