-- Add hourly_rate column to projects table
ALTER TABLE projects ADD COLUMN hourly_rate DECIMAL(10,2);

-- Create settings table for global configurations
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    default_hourly_rate DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (default_hourly_rate, currency) VALUES (50.00, 'EUR');