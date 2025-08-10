-- Create roles table for advanced role management
-- This allows for custom roles with specific permissions

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, permissions, is_system, is_active) VALUES
('admin', 'Admin', 'Full system access with all permissions', 
 ARRAY[
   'users.view', 'users.create', 'users.edit', 'users.delete', 'users.bulk',
   'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.approve',
   'dashboard.view', 'analytics.view', 'reports.generate',
   'settings.view', 'settings.edit', 'logs.view', 'backup.create',
   'promoters.view', 'promoters.create', 'promoters.edit', 'promoters.delete', 'promoters.bulk', 'promoters.export',
   'parties.view', 'parties.create', 'parties.edit', 'parties.delete', 'parties.bulk', 'parties.export'
 ], 
 TRUE, TRUE),

('manager', 'Manager', 'User management and contract approval', 
 ARRAY[
   'users.view', 'users.create', 'users.edit',
   'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.approve',
   'dashboard.view', 'analytics.view', 'reports.generate',
   'promoters.view', 'promoters.create', 'promoters.edit',
   'parties.view', 'parties.create', 'parties.edit'
 ], 
 TRUE, TRUE),

('user', 'User', 'Basic contract operations', 
 ARRAY[
   'contracts.view', 'contracts.create', 'contracts.edit',
   'dashboard.view',
   'promoters.view',
   'parties.view'
 ], 
 TRUE, TRUE),

('viewer', 'Viewer', 'Read-only access', 
 ARRAY[
   'contracts.view',
   'dashboard.view',
   'promoters.view',
   'parties.view'
 ], 
 TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE roles IS 'Stores system roles with their associated permissions';
COMMENT ON COLUMN roles.name IS 'Unique role identifier (used in code)';
COMMENT ON COLUMN roles.display_name IS 'Human-readable role name';
COMMENT ON COLUMN roles.permissions IS 'Array of permission IDs granted to this role';
COMMENT ON COLUMN roles.is_system IS 'Whether this is a system role that cannot be deleted';
COMMENT ON COLUMN roles.is_active IS 'Whether this role is currently active';

-- Create a view to get role statistics
CREATE OR REPLACE VIEW role_statistics AS
SELECT 
    r.id,
    r.name,
    r.display_name,
    r.description,
    r.permissions,
    r.is_system,
    r.is_active,
    COUNT(u.id) as user_count,
    r.created_at,
    r.updated_at
FROM roles r
LEFT JOIN users u ON u.role = r.name
WHERE r.is_active = TRUE
GROUP BY r.id, r.name, r.display_name, r.description, r.permissions, r.is_system, r.is_active, r.created_at, r.updated_at
ORDER BY r.name;

-- Create function to get user permissions based on role
CREATE OR REPLACE FUNCTION get_role_permissions(p_role_name VARCHAR)
RETURNS TEXT[] AS $$
DECLARE
    role_permissions TEXT[];
BEGIN
    SELECT permissions INTO role_permissions
    FROM roles
    WHERE name = p_role_name AND is_active = TRUE;
    
    RETURN COALESCE(role_permissions, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    role_permissions TEXT[];
BEGIN
    -- Get user's role
    SELECT role INTO user_role
    FROM users
    WHERE id = p_user_id;
    
    -- Get role permissions
    SELECT permissions INTO role_permissions
    FROM roles
    WHERE name = user_role AND is_active = TRUE;
    
    -- Check if permission is granted
    RETURN p_permission = ANY(COALESCE(role_permissions, ARRAY[]::TEXT[]));
END;
$$ LANGUAGE plpgsql; 