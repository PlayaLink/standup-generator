-- Remove NOT NULL constraints from platform-specific fields
-- This allows users to be created from any platform (web, Slack, Teams)
-- without requiring fields from other platforms

ALTER TABLE users ALTER COLUMN slack_user_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN slack_team_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN teams_user_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN teams_tenant_id DROP NOT NULL;

-- Add unique constraints for non-null combinations to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slack_unique
  ON users(slack_user_id, slack_team_id)
  WHERE slack_user_id IS NOT NULL AND slack_team_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teams_unique
  ON users(teams_user_id, teams_tenant_id)
  WHERE teams_user_id IS NOT NULL AND teams_tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users(email)
  WHERE email IS NOT NULL;

-- Add documentation comments
COMMENT ON COLUMN users.slack_user_id IS 'Slack user ID - required only for Slack platform users';
COMMENT ON COLUMN users.slack_team_id IS 'Slack team/workspace ID - required only for Slack platform users';
COMMENT ON COLUMN users.teams_user_id IS 'Microsoft Teams user ID - required only for Teams platform users';
COMMENT ON COLUMN users.teams_tenant_id IS 'Microsoft Teams tenant ID - required only for Teams platform users';
COMMENT ON COLUMN users.email IS 'Email address - required only for web platform users';
