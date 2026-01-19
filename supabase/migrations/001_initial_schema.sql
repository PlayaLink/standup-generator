-- Standup Generator Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rrtijgttekxejmickkvj/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slack_user_id TEXT,
  slack_team_id TEXT,
  teams_user_id TEXT,
  teams_tenant_id TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_slack ON users(slack_user_id, slack_team_id);
CREATE INDEX IF NOT EXISTS idx_users_teams ON users(teams_user_id, teams_tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- OAuth tokens table (encrypted)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'jira',
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);

-- Jira configuration per user
CREATE TABLE IF NOT EXISTS jira_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  jira_cloud_id TEXT NOT NULL,
  jira_base_url TEXT NOT NULL,
  board_id TEXT,
  board_name TEXT,
  project_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for config lookups
CREATE INDEX IF NOT EXISTS idx_jira_configs_user ON jira_configs(user_id);

-- Ticket name overrides
CREATE TABLE IF NOT EXISTS ticket_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ticket_key TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticket_key)
);

-- Index for ticket name lookups
CREATE INDEX IF NOT EXISTS idx_ticket_names_user ON ticket_names(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_names_key ON ticket_names(ticket_key);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jira_configs_updated_at ON jira_configs;
CREATE TRIGGER update_jira_configs_updated_at
  BEFORE UPDATE ON jira_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_names ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on oauth_tokens" ON oauth_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on jira_configs" ON jira_configs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ticket_names" ON ticket_names
  FOR ALL USING (auth.role() = 'service_role');
