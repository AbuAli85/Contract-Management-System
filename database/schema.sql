-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with full user management support
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions TEXT[], -- Array of permission strings
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Drop permissions table if it exists and recreate it
DROP TABLE IF EXISTS permissions CASCADE;

-- Create permissions table for detailed permission management
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (id, name, description, category) VALUES
-- User Management
('users.view', 'View Users', 'Can view user list and details', 'User Management'),
('users.create', 'Create Users', 'Can create new users', 'User Management'),
('users.edit', 'Edit Users', 'Can edit user information', 'User Management'),
('users.delete', 'Delete Users', 'Can delete users', 'User Management'),
('users.bulk', 'Bulk Actions', 'Can perform bulk operations on users', 'User Management'),

-- Contract Management
('contracts.view', 'View Contracts', 'Can view contracts', 'Contract Management'),
('contracts.create', 'Create Contracts', 'Can create new contracts', 'Contract Management'),
('contracts.edit', 'Edit Contracts', 'Can edit contracts', 'Contract Management'),
('contracts.delete', 'Delete Contracts', 'Can delete contracts', 'Contract Management'),
('contracts.approve', 'Approve Contracts', 'Can approve contracts', 'Contract Management'),

-- Dashboard & Analytics
('dashboard.view', 'View Dashboard', 'Can view dashboard', 'Dashboard'),
('analytics.view', 'View Analytics', 'Can view analytics and reports', 'Dashboard'),
('reports.generate', 'Generate Reports', 'Can generate reports', 'Dashboard'),

-- System Administration
('settings.view', 'View Settings', 'Can view system settings', 'System'),
('settings.edit', 'Edit Settings', 'Can edit system settings', 'System'),
('logs.view', 'View Logs', 'Can view system logs', 'System'),
('backup.create', 'Create Backups', 'Can create system backups', 'System');

-- Create user_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_log (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_details, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Create default admin user (password should be changed)
-- Note: In production, this should be done through a secure setup process
INSERT INTO users (
    email, 
    full_name, 
    role, 
    status, 
    permissions,
    email_verified,
    created_at
) VALUES (
    'admin@example.com',
    'System Administrator',
    'admin',
    'active',
    ARRAY[
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.bulk',
        'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.approve',
        'dashboard.view', 'analytics.view', 'reports.generate',
        'settings.view', 'settings.edit', 'logs.view', 'backup.create'
    ],
    TRUE,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Only admins and authorized users can create users" ON users;
DROP POLICY IF EXISTS "Only admins and authorized users can update users" ON users;
DROP POLICY IF EXISTS "Only admins and authorized users can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_log;

-- Policy for users table - users can view their own data and admins can view all
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR 
                     EXISTS (
                         SELECT 1 FROM users 
                         WHERE id = auth.uid() 
                         AND (role = 'admin' OR permissions @> ARRAY['users.view'])
                     ));

-- Policy for users table - only admins and users with create permission can insert
CREATE POLICY "Only admins and authorized users can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR permissions @> ARRAY['users.create'])
        )
    );

-- Policy for users table - only admins and users with edit permission can update
CREATE POLICY "Only admins and authorized users can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR permissions @> ARRAY['users.edit'])
        )
    );

-- Policy for users table - only admins and users with delete permission can delete
CREATE POLICY "Only admins and authorized users can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR permissions @> ARRAY['users.delete'])
        )
    );

-- Policy for activity log - users can view their own activity, admins can view all
CREATE POLICY "Users can view own activity" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id OR 
                     EXISTS (
                         SELECT 1 FROM users 
                         WHERE id = auth.uid() 
                         AND (role = 'admin' OR permissions @> ARRAY['logs.view'])
                     ));

-- Policy for activity log - system can insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (true);

-- Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
    COUNT(*) FILTER (WHERE role = 'manager') as manager_users,
    COUNT(*) FILTER (WHERE role = 'user') as regular_users,
    COUNT(*) FILTER (WHERE role = 'viewer') as viewer_users,
    COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as recent_logins
FROM users;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    SELECT permissions INTO user_permissions
    FROM users
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_permissions, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    SELECT permissions INTO user_permissions
    FROM users
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_permissions @> ARRAY[p_permission], FALSE);
END;
$$ LANGUAGE plpgsql; 