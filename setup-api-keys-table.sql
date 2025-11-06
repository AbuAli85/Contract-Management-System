-- ========================================
-- Setup API Keys Table
-- ========================================
-- Run this in your Supabase SQL Editor

-- Create api_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  allowed_origins TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can update API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can delete API keys" ON api_keys;

-- RLS Policies
-- Policy: Only admins can view all API keys
CREATE POLICY "Admins can view all API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
      AND r.name = 'admin'
      AND ura.is_active = TRUE
    )
  );

-- Policy: Only admins can create API keys
CREATE POLICY "Admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
      AND r.name = 'admin'
      AND ura.is_active = TRUE
    )
  );

-- Policy: Only admins can update API keys
CREATE POLICY "Admins can update API keys"
  ON api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
      AND r.name = 'admin'
      AND ura.is_active = TRUE
    )
  );

-- Policy: Only admins can delete API keys
CREATE POLICY "Admins can delete API keys"
  ON api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
      AND r.name = 'admin'
      AND ura.is_active = TRUE
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;

-- Grant permissions to service_role (for service role client)
-- This allows the service role key to bypass RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO service_role;

-- Also grant to anon role (sometimes needed for service role operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO anon;

-- Verify table was created
SELECT 
  'Table created successfully' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'api_keys';

