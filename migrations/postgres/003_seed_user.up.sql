-- Insert seed user for development
INSERT INTO users (id, email, name) VALUES
    (1, 'developer@example.com', 'Developer User')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();