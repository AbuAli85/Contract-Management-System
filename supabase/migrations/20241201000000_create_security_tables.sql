-- Create MFA table for storing TOTP secrets and backup codes
CREATE TABLE IF NOT EXISTS user_mfa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one MFA record per user
  UNIQUE(user_id)
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  path TEXT,
  method TEXT,
  status_code INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting logs table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  requests_count INTEGER NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create failed login attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  
  -- Composite unique constraint for tracking attempts per email/IP
  UNIQUE(email, ip_address)
);

-- Create session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Ensure unique active sessions per user
  UNIQUE(user_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier ON rate_limit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_ip ON failed_login_attempts(email, ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_blocked_until ON failed_login_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create RLS policies for security tables
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User MFA policies
CREATE POLICY "Users can view their own MFA settings" ON user_mfa
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings" ON user_mfa
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings" ON user_mfa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security audit log policies (admin only)
CREATE POLICY "Admins can view all security audit logs" ON security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert security audit logs" ON security_audit_log
  FOR INSERT WITH CHECK (true);

-- Rate limit logs policies (admin only)
CREATE POLICY "Admins can view all rate limit logs" ON rate_limit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert rate limit logs" ON rate_limit_logs
  FOR INSERT WITH CHECK (true);

-- Failed login attempts policies (admin only)
CREATE POLICY "Admins can view all failed login attempts" ON failed_login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert failed login attempts" ON failed_login_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update failed login attempts" ON failed_login_attempts
  FOR UPDATE USING (true);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for security operations

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to track failed login attempts
CREATE OR REPLACE FUNCTION track_failed_login(
  p_email TEXT,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if IP is already blocked
  SELECT blocked_until INTO v_blocked_until
  FROM failed_login_attempts
  WHERE email = p_email AND ip_address = p_ip_address;
  
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN false; -- Still blocked
  END IF;
  
  -- Insert or update failed attempt
  INSERT INTO failed_login_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip_address, p_user_agent)
  ON CONFLICT (email, ip_address) DO UPDATE SET
    attempt_count = failed_login_attempts.attempt_count + 1,
    last_attempt_at = NOW(),
    blocked_until = CASE 
      WHEN failed_login_attempts.attempt_count >= 4 THEN NOW() + INTERVAL '15 minutes'
      WHEN failed_login_attempts.attempt_count >= 6 THEN NOW() + INTERVAL '1 hour'
      WHEN failed_login_attempts.attempt_count >= 8 THEN NOW() + INTERVAL '24 hours'
      ELSE NULL
    END;
  
  -- Log the security event
  PERFORM log_security_event(
    'failed_login_attempt',
    NULL,
    jsonb_build_object(
      'email', p_email,
      'ip_address', p_ip_address,
      'user_agent', p_user_agent
    )
  );
  
  RETURN true;
END;
$$;

-- Function to check if login is blocked
CREATE OR REPLACE FUNCTION is_login_blocked(
  p_email TEXT,
  p_ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT blocked_until INTO v_blocked_until
  FROM failed_login_attempts
  WHERE email = p_email AND ip_address = p_ip_address;
  
  RETURN v_blocked_until IS NOT NULL AND v_blocked_until > NOW();
END;
$$;

-- Function to reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(
  p_email TEXT,
  p_ip_address INET
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE email = p_email AND ip_address = p_ip_address;
  
  -- Log the security event
  PERFORM log_security_event(
    'failed_login_reset',
    NULL,
    jsonb_build_object(
      'email', p_email,
      'ip_address', p_ip_address
    )
  );
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Create a scheduled job to clean up expired sessions (runs every hour)
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_sessions();'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa TO authenticated;
GRANT SELECT ON security_audit_log TO authenticated;
GRANT SELECT ON rate_limit_logs TO authenticated;
GRANT SELECT ON failed_login_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION track_failed_login(TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_login_blocked(TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_failed_login_attempts(TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;
