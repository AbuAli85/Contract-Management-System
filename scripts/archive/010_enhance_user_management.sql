-- Enhanced User Management System Migration
-- This script adds comprehensive user management features to the app_users table

-- Add new columns to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);
CREATE INDEX IF NOT EXISTS idx_app_users_department ON app_users(department);
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at);
CREATE INDEX IF NOT EXISTS idx_app_users_last_login ON app_users(last_login);
CREATE INDEX IF NOT EXISTS idx_app_users_created_by ON app_users(created_by);

-- Create user_roles table for more flexible role management
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity_logs table for detailed activity tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_invitations table for user invitations
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES app_users(id),
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES app_users(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Insert default system roles
INSERT INTO user_roles (name, description, permissions, is_system_role) VALUES
('admin', 'System Administrator', '{"all": true}', TRUE),
('manager', 'Manager', '{"contracts": {"read": true, "write": true, "delete": true}, "users": {"read": true, "write": true}, "parties": {"read": true, "write": true, "delete": true}, "promoters": {"read": true, "write": true, "delete": true}}', TRUE),
('user', 'Regular User', '{"contracts": {"read": true, "write": true}, "parties": {"read": true, "write": true}, "promoters": {"read": true, "write": true}}', TRUE),
('viewer', 'Viewer', '{"contracts": {"read": true}, "parties": {"read": true}, "promoters": {"read": true}}', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_app_users_updated_at 
    BEFORE UPDATE ON app_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id, action, entity_type, entity_id, details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_contracts', (SELECT COUNT(*) FROM contracts WHERE user_id = p_user_id),
        'active_contracts', (SELECT COUNT(*) FROM contracts WHERE user_id = p_user_id AND status = 'active'),
        'total_parties', (SELECT COUNT(*) FROM parties WHERE owner_id = p_user_id),
        'total_promoters', (SELECT COUNT(*) FROM promoters WHERE employer_id = p_user_id),
        'last_activity', (SELECT MAX(created_at) FROM user_activity_logs WHERE user_id = p_user_id),
        'total_sessions', (SELECT COUNT(*) FROM user_sessions WHERE user_id = p_user_id AND is_active = true),
        'failed_logins', (SELECT failed_login_attempts FROM app_users WHERE id = p_user_id)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_invitations WHERE expires_at < NOW() AND status = 'pending';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view roles" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User activity logs policies
CREATE POLICY "Users can view their own activity" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User invitations policies
CREATE POLICY "Users can view invitations they created" ON user_invitations
    FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Admins can manage all invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update existing app_users RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

CREATE POLICY "Users can view their own profile" ON app_users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON app_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage users" ON app_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create a view for user dashboard data
CREATE OR REPLACE VIEW user_dashboard_data AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.status,
    u.department,
    u.position,
    u.avatar_url,
    u.created_at,
    u.last_login,
    u.updated_at,
    get_user_stats(u.id) as stats,
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) as active_sessions,
    (SELECT COUNT(*) FROM user_activity_logs WHERE user_id = u.id AND created_at > NOW() - INTERVAL '24 hours') as recent_activity_count
FROM app_users u;

-- Grant necessary permissions
GRANT SELECT ON user_dashboard_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON user_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_invitations TO authenticated;

-- Create comments for documentation
COMMENT ON TABLE app_users IS 'Enhanced user management table with comprehensive user data';
COMMENT ON TABLE user_roles IS 'User roles with granular permissions';
COMMENT ON TABLE user_sessions IS 'User session tracking for security and analytics';
COMMENT ON TABLE user_activity_logs IS 'Detailed user activity logging';
COMMENT ON TABLE user_invitations IS 'User invitation system for onboarding';

COMMENT ON FUNCTION get_user_stats(UUID) IS 'Get comprehensive statistics for a user';
COMMENT ON FUNCTION log_user_activity(UUID, TEXT, TEXT, TEXT, JSONB, INET, TEXT) IS 'Log user activity for audit trail';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Clean up expired user sessions';
COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Clean up expired user invitations';

-- Insert sample data for testing (optional)
-- INSERT INTO app_users (email, role, full_name, department, status) VALUES
-- ('admin@example.com', 'admin', 'System Administrator', 'IT', 'active'),
-- ('manager@example.com', 'manager', 'Department Manager', 'Operations', 'active'),
-- ('user@example.com', 'user', 'Regular User', 'Sales', 'active'),
-- ('viewer@example.com', 'viewer', 'Read Only User', 'Marketing', 'active'); 