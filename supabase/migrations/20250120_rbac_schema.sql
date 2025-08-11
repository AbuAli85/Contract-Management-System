-- ========================================
-- 🛡️ RBAC SCHEMA MIGRATION
-- ========================================
-- This migration creates a production-grade RBAC system
-- with proper indexing, constraints, and materialized views

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ROLES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('client', 'provider', 'admin', 'system')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PERMISSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('own', 'provider', 'organization', 'booking', 'public', 'all')),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ROLE-PERMISSION MAPPING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(role_id, permission_id)
);

-- ========================================
-- USER ROLE ASSIGNMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID NULL,
    context JSONB DEFAULT '{}',
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- AUDIT LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    event_type TEXT NOT NULL,
    permission TEXT NULL,
    resource TEXT NULL,
    action TEXT NULL,
    result TEXT NOT NULL CHECK (result IN ('ALLOW', 'DENY', 'WOULD_BLOCK')),
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    changed_by UUID NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_roles_category ON roles(category);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_active ON user_role_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_valid_until ON user_role_assignments(valid_until) WHERE valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_permission ON audit_logs(permission);

-- ========================================
-- MATERIALIZED VIEW FOR OPTIMIZED PERMISSION LOOKUPS
-- ========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS user_permissions AS
SELECT 
    ura.user_id,
    p.resource,
    p.action,
    p.scope,
    p.name AS permission_name,
    r.name AS role_name,
    r.category AS role_category,
    ura.valid_from,
    ura.valid_until,
    ura.is_active
FROM user_role_assignments ura
JOIN roles r ON ura.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ura.is_active = TRUE
AND (ura.valid_until IS NULL OR ura.valid_until > CURRENT_TIMESTAMP);

-- Indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource_action ON user_permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON user_permissions(scope);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role_category ON user_permissions(role_category);

-- ========================================
-- FUNCTIONS FOR RBAC OPERATIONS
-- ========================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_user_permissions()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT,
    p_scope TEXT DEFAULT 'own'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = p_user_id
        AND up.resource = p_resource
        AND up.action = p_action
        AND (up.scope = p_scope OR up.scope = 'all')
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    resource TEXT,
    action TEXT,
    scope TEXT,
    permission_name TEXT,
    role_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.resource,
        up.action,
        up.scope,
        up.permission_name,
        up.role_name
    FROM user_permissions up
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log permission usage
CREATE OR REPLACE FUNCTION log_permission_usage(
    p_user_id UUID,
    p_permission TEXT,
    p_resource TEXT,
    p_action TEXT,
    p_result TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        event_type,
        permission,
        resource,
        action,
        result,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        'PERMISSION_CHECK',
        p_permission,
        p_resource,
        p_action,
        p_result,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log role changes
CREATE OR REPLACE FUNCTION log_role_change(
    p_user_id UUID,
    p_old_roles JSONB,
    p_new_roles JSONB,
    p_changed_by UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        event_type,
        old_value,
        new_value,
        changed_by,
        ip_address,
        user_agent,
        result
    ) VALUES (
        p_user_id,
        'ROLE_CHANGE',
        p_old_roles,
        p_new_roles,
        p_changed_by,
        p_ip_address,
        p_user_agent,
        'ALLOW'
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Trigger to update updated_at timestamp on roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- Trigger to update updated_at timestamp on user_role_assignments
CREATE OR REPLACE FUNCTION update_user_role_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_role_assignments_updated_at
    BEFORE UPDATE ON user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_role_assignments_updated_at();

-- Trigger to refresh materialized view when role assignments change
CREATE OR REPLACE FUNCTION refresh_user_permissions_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule a refresh (non-blocking)
    PERFORM pg_notify('refresh_user_permissions', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_user_permissions
    AFTER INSERT OR UPDATE OR DELETE ON user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION refresh_user_permissions_on_change();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Roles: Only admins can manage
CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'role'
            AND up.action = 'manage'
            AND up.scope = 'all'
        )
    );

-- Permissions: Only admins can manage
CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'permission'
            AND up.action = 'manage'
            AND up.scope = 'all'
        )
    );

-- Role permissions: Only admins can manage
CREATE POLICY "Admins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'role'
            AND up.action = 'manage'
            AND up.scope = 'all'
        )
    );

-- User role assignments: Users can view own, admins can manage all
CREATE POLICY "Users can view own role assignments" ON user_role_assignments
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'user'
            AND up.action = 'manage'
            AND up.scope = 'all'
        )
    );

CREATE POLICY "Admins can manage role assignments" ON user_role_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'user'
            AND up.action = 'manage'
            AND up.scope = 'all'
        )
    );

-- Audit logs: Users can view own, admins can view all
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.resource = 'audit'
            AND up.action = 'view'
            AND up.scope = 'all'
        )
    );

-- ========================================
-- GRANTS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON user_permissions TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;

-- Grant all permissions to service role (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE roles IS 'System roles for RBAC implementation';
COMMENT ON TABLE permissions IS 'Granular permissions with resource:action:scope format';
COMMENT ON TABLE role_permissions IS 'Mapping between roles and permissions';
COMMENT ON TABLE user_role_assignments IS 'User role assignments with temporal validity';
COMMENT ON TABLE audit_logs IS 'Audit trail for all RBAC operations';
COMMENT ON MATERIALIZED VIEW user_permissions IS 'Optimized view for permission lookups';

COMMENT ON FUNCTION has_permission IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
COMMENT ON FUNCTION log_permission_usage IS 'Log permission check results';
COMMENT ON FUNCTION log_role_change IS 'Log role assignment changes';
COMMENT ON FUNCTION refresh_user_permissions IS 'Refresh the materialized view';
