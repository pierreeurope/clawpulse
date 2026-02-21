-- Add last_pushed_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_pushed_at TIMESTAMPTZ;

-- Set initial value to updated_at for existing users
UPDATE users SET last_pushed_at = updated_at WHERE last_pushed_at IS NULL;
