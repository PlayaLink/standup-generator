-- Add user_reports and user_formatting tables
-- Run this in Supabase SQL Editor

-- User reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_key TEXT NOT NULL,
  board_name TEXT,
  report TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for report lookups
CREATE INDEX IF NOT EXISTS idx_user_reports_user ON user_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

-- User formatting table
CREATE TABLE IF NOT EXISTS user_formatting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  formatting_instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for formatting lookups
CREATE INDEX IF NOT EXISTS idx_user_formatting_user ON user_formatting(user_id);

-- Apply updated_at trigger for user_formatting
DROP TRIGGER IF EXISTS update_user_formatting_updated_at ON user_formatting;
CREATE TRIGGER update_user_formatting_updated_at
  BEFORE UPDATE ON user_formatting
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_formatting ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on user_reports" ON user_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on user_formatting" ON user_formatting
  FOR ALL USING (auth.role() = 'service_role');
