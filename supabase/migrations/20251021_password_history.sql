-- ============================================
-- Password History Table
-- Stores hashed passwords to prevent reuse
-- ============================================

-- Create password_history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT unique_user_password UNIQUE (user_id, password_hash)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_password_history_user_id 
  ON password_history(user_id);
  
CREATE INDEX IF NOT EXISTS idx_password_history_created_at 
  ON password_history(created_at DESC);

-- Create composite index for fetching recent passwords
CREATE INDEX IF NOT EXISTS idx_password_history_user_created 
  ON password_history(user_id, created_at DESC);

-- Add comments
COMMENT ON TABLE password_history IS 'Stores password hashes to prevent password reuse';
COMMENT ON COLUMN password_history.user_id IS 'User who changed their password';
COMMENT ON COLUMN password_history.password_hash IS 'SHA-256 hash of the password (NOT for authentication)';
COMMENT ON COLUMN password_history.created_at IS 'When the password was set';

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own password history (for validation)
CREATE POLICY "Users can read their own password history"
  ON password_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert password history (via service role)
CREATE POLICY "System can insert password history"
  ON password_history
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all password history for security audits
CREATE POLICY "Admins can view all password history"
  ON password_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- Function to automatically add password to history
-- ============================================

CREATE OR REPLACE FUNCTION add_password_to_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only keep last 10 passwords
  DELETE FROM password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 10
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_cleanup_password_history
  AFTER INSERT ON password_history
  FOR EACH ROW
  EXECUTE FUNCTION add_password_to_history();

-- ============================================
-- Helper function to check password reuse
-- ============================================

CREATE OR REPLACE FUNCTION check_password_reused(
  p_user_id UUID,
  p_password_hash TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM password_history
    WHERE user_id = p_user_id
    AND password_hash = p_password_hash
    AND created_at >= NOW() - INTERVAL '1 year'
    ORDER BY created_at DESC
    LIMIT p_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON password_history TO authenticated;
GRANT INSERT ON password_history TO service_role;

