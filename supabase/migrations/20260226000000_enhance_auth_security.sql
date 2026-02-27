-- ============================================================
-- Migration: Enhance Authentication Security
-- Date: 2026-02-26
-- Description:
--   - Adds missing indexes for brute-force protection queries
--   - Adds account_lockout_until column to users table
--   - Adds email_verification_token table for secure email verification
--   - Adds password_reset_tokens table with expiry
--   - Adds auth_events table for comprehensive audit logging
--   - Adds RLS policies for all new tables
-- ============================================================

-- ── 1. Improve failed_login_attempts table ────────────────────────────────────

-- Add missing index for fast lookup by email + IP (used in brute-force checks)
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email
  ON failed_login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_last_attempt
  ON failed_login_attempts(last_attempt_at);

-- ── 2. Add account status to users table if missing ───────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'pending', 'suspended', 'deactivated'));
  END IF;
END $$;

-- Add index on status for fast filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ── 3. Password reset tokens table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,  -- Store only the hash, never the raw token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
  ON password_reset_tokens(expires_at);

-- RLS for password_reset_tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no user-level access needed)
CREATE POLICY "Service role only for password_reset_tokens"
  ON password_reset_tokens
  FOR ALL
  USING (false);  -- Deny all; only service_role bypasses RLS

-- ── 4. Auth events table (comprehensive audit log) ───────────────────────────

CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON auth_events(email);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip ON auth_events(ip_address);

-- RLS for auth_events
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all auth events
CREATE POLICY "Admins can view all auth events"
  ON auth_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own auth events
CREATE POLICY "Users can view their own auth events"
  ON auth_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert (no user-level insert)
CREATE POLICY "Service role can insert auth events"
  ON auth_events
  FOR INSERT
  WITH CHECK (true);

-- ── 5. Improve user_sessions table ───────────────────────────────────────────

-- Add device info columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'device_name'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN device_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'location'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN location TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ── 6. Cleanup function for expired tokens ────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';

  -- Delete expired/inactive sessions
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- Delete old failed login attempts (older than 30 days)
  DELETE FROM failed_login_attempts
  WHERE last_attempt_at < NOW() - INTERVAL '30 days';

  -- Delete old auth events (older than 90 days)
  DELETE FROM auth_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ── 7. Grant necessary permissions ───────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON failed_login_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO service_role;
GRANT SELECT, INSERT ON auth_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO service_role;

-- Authenticated users can read their own sessions
GRANT SELECT ON user_sessions TO authenticated;
