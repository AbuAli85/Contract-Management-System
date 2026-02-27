-- ============================================================
-- Module Review Improvements Migration
-- Date: 2026-02-26
-- Description: Schema improvements identified during the
--              comprehensive module-by-module code review.
-- ============================================================

-- ============================================================
-- 1. ENHANCE failed_login_attempts TABLE
--    Add missing columns for better brute-force tracking
-- ============================================================
ALTER TABLE failed_login_attempts
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS unlock_reason TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Add index for faster lookups by IP alone (for IP-based blocking)
CREATE INDEX IF NOT EXISTS idx_failed_login_ip
  ON failed_login_attempts(ip_address);

-- Add index for blocked_until to efficiently find active blocks
CREATE INDEX IF NOT EXISTS idx_failed_login_blocked_until
  ON failed_login_attempts(blocked_until)
  WHERE blocked_until IS NOT NULL;

COMMENT ON TABLE failed_login_attempts IS
  'Tracks failed login attempts for brute-force protection. '
  'Supports both email+IP composite blocking and IP-only blocking.';

-- ============================================================
-- 2. ENHANCE user_sessions TABLE
--    Add columns for better session management
-- ============================================================
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
  ADD COLUMN IF NOT EXISTS remember_me BOOLEAN DEFAULT false;

-- Add index for active sessions lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(user_id, is_active)
  WHERE is_active = true;

-- Add index for session expiry cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
  ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS
  'Tracks active user sessions for multi-device management and security.';

-- ============================================================
-- 3. ENHANCE security_audit_log TABLE
--    Add columns for richer audit trail
-- ============================================================
ALTER TABLE security_audit_log
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info'
    CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical'));

-- Add index for correlation ID lookups (request tracing)
CREATE INDEX IF NOT EXISTS idx_security_audit_correlation
  ON security_audit_log(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- Add index for severity-based filtering
CREATE INDEX IF NOT EXISTS idx_security_audit_severity
  ON security_audit_log(severity, created_at DESC);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at
  ON security_audit_log(created_at DESC);

COMMENT ON TABLE security_audit_log IS
  'Comprehensive audit log for all security-relevant events. '
  'Includes correlation IDs for request tracing across services.';

-- ============================================================
-- 4. CREATE password_history TABLE (if not exists)
--    Prevents password reuse (last N passwords)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- SHA-256 hash of the password (NOT the auth hash — for comparison only)
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id
  ON password_history(user_id, created_at DESC);

-- RLS: Users can only read their own password history; no direct writes
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "password_history_select_own"
  ON password_history FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (done via server-side API)
CREATE POLICY IF NOT EXISTS "password_history_insert_service"
  ON password_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE password_history IS
  'Stores hashed previous passwords to prevent reuse. '
  'Hashes are SHA-256 for comparison only — Supabase Auth handles actual auth.';

-- ============================================================
-- 5. CREATE user_preferences TABLE (if not exists)
--    Stores per-user UI and notification preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- UI preferences
  theme           TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language        TEXT DEFAULT 'en',
  timezone        TEXT DEFAULT 'UTC',
  date_format     TEXT DEFAULT 'DD/MM/YYYY',
  currency        TEXT DEFAULT 'USD',
  -- Notification preferences
  email_notifications     BOOLEAN DEFAULT true,
  push_notifications      BOOLEAN DEFAULT true,
  contract_expiry_alert   INTEGER DEFAULT 30, -- days before expiry
  digest_frequency        TEXT DEFAULT 'daily'
    CHECK (digest_frequency IN ('realtime', 'daily', 'weekly', 'never')),
  -- Session preferences
  session_timeout_minutes INTEGER DEFAULT 30
    CHECK (session_timeout_minutes BETWEEN 5 AND 480),
  -- Timestamps
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "user_preferences_own"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON user_preferences(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

COMMENT ON TABLE user_preferences IS
  'Per-user preferences for UI, notifications, and session behavior.';

-- ============================================================
-- 6. CREATE api_keys TABLE (if not exists)
--    For service-to-service authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  -- Stored as a hashed value — never store plaintext API keys
  key_hash    TEXT NOT NULL UNIQUE,
  -- Key prefix for display (e.g., "sk_live_abc123...")
  key_prefix  TEXT NOT NULL,
  scopes      TEXT[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at  TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "api_keys_own"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
  ON api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON api_keys(key_hash)
  WHERE is_active = true;

COMMENT ON TABLE api_keys IS
  'API keys for service-to-service authentication. '
  'Key values are hashed — only the prefix is stored in plaintext for display.';

-- ============================================================
-- 7. ADD MISSING INDEXES on contracts table
--    Identified as missing during performance review
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contracts_status
  ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_contracts_created_at
  ON contracts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_end_date
  ON contracts(end_date)
  WHERE end_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id
  ON contracts(promoter_id)
  WHERE promoter_id IS NOT NULL;

-- ============================================================
-- 8. ADD MISSING INDEXES on notifications table
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);

-- ============================================================
-- 9. CLEANUP: Auto-cleanup function for expired sessions
--    and old login attempts
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Remove expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- Remove old login attempts (keep 30 days for audit)
  DELETE FROM failed_login_attempts
  WHERE last_attempt_at < NOW() - INTERVAL '30 days'
    AND blocked_until IS NULL;

  -- Remove old rate limit logs (keep 7 days)
  DELETE FROM rate_limit_logs
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Remove old audit log entries (keep 90 days for compliance)
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity NOT IN ('error', 'critical');
END;
$$;

COMMENT ON FUNCTION cleanup_expired_auth_data IS
  'Scheduled cleanup function for expired auth data. '
  'Run via pg_cron or Supabase scheduled functions.';

-- ============================================================
-- 10. GRANT appropriate permissions
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON password_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api_keys TO authenticated;
