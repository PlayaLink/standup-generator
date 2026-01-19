-- Add missing columns to users table using IF NOT EXISTS
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_team_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teams_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teams_tenant_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_slack ON users(slack_user_id, slack_team_id);
CREATE INDEX IF NOT EXISTS idx_users_teams ON users(teams_user_id, teams_tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
