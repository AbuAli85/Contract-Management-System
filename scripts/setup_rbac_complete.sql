-- ========================================
-- 🛡️ COMPLETE RBAC SETUP
-- ========================================
-- This script does EVERYTHING needed to set up RBAC:
-- 1. Creates the schema (tables, indexes, views)
-- 2. Seeds roles and permissions
-- 3. Assigns admin role to the first user
--
-- Run this ONE script in Supabase SQL Editor
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PART 1: CREATE SCHEMA
-- ========================================

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('client', 'provider', 'admin', 'system')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('own', 'provider', 'organization', 'booking', 'public', 'all')),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ROLE-PERMISSION MAPPING TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(role_id, permission_id)
);

-- USER ROLE ASSIGNMENTS TABLE
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

-- AUDIT LOGS TABLE (if not exists)
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

-- CREATE INDEXES
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- CREATE MATERIALIZED VIEW
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

-- CREATE INDEXES ON MATERIALIZED VIEW
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource_action ON user_permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON user_permissions(scope);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role_category ON user_permissions(role_category);

-- CREATE REFRESH FUNCTION
CREATE OR REPLACE FUNCTION refresh_user_permissions()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions;
EXCEPTION WHEN undefined_table THEN
    REFRESH MATERIALIZED VIEW user_permissions;
END;
$$ LANGUAGE plpgsql;

-- ENABLE RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES (basic ones)
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
CREATE POLICY "Allow authenticated users to read roles" ON roles
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read permissions" ON permissions;
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- GRANT PERMISSIONS
GRANT SELECT ON user_permissions TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;

-- ========================================
-- PART 2: SEED ROLES
-- ========================================

-- Client Roles
INSERT INTO roles (name, category, description) VALUES
    ('Basic Client', 'client', 'Basic client with limited booking capabilities'),
    ('Premium Client', 'client', 'Premium client with enhanced features'),
    ('Enterprise Client', 'client', 'Enterprise client with full feature access'),
    ('Client Administrator', 'client', 'Client organization administrator')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- Provider Roles
INSERT INTO roles (name, category, description) VALUES
    ('Individual Provider', 'provider', 'Individual service provider'),
    ('Provider Team Member', 'provider', 'Member of a provider team'),
    ('Provider Manager', 'provider', 'Manager of provider team or organization'),
    ('Provider Administrator', 'provider', 'Administrator of provider organization')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- Admin Roles
INSERT INTO roles (name, category, description) VALUES
    ('Support Agent', 'admin', 'Customer support agent'),
    ('Content Moderator', 'admin', 'Content moderation specialist'),
    ('Platform Administrator', 'admin', 'Platform-level administrator'),
    ('System Administrator', 'admin', 'System-level administrator with full access')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- ========================================
-- PART 3: SEED PERMISSIONS (CONTRACT FOCUSED)
-- ========================================

-- Contract permissions (THE CRITICAL ONES)
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts'),
    ('contract', 'create', 'own', 'contract:create:own', 'Create own contracts'),
    ('contract', 'update', 'own', 'contract:update:own', 'Update own contracts'),
    ('contract', 'delete', 'own', 'contract:delete:own', 'Delete own contracts'),
    ('contract', 'generate', 'own', 'contract:generate:own', 'Generate own contracts'),
    ('contract', 'download', 'own', 'contract:download:own', 'Download own contracts'),
    ('contract', 'submit', 'own', 'contract:submit:own', 'Submit own contracts for approval'),
    ('contract', 'message', 'own', 'contract:message:own', 'Send messages related to own contracts'),
    ('contract', 'approve', 'all', 'contract:approve:all', 'Approve contracts')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- User & Profile permissions
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('user', 'view', 'own', 'user:view:own', 'View own user profile'),
    ('user', 'edit', 'own', 'user:edit:own', 'Edit own user profile'),
    ('user', 'view', 'all', 'user:view:all', 'View all users'),
    ('profile', 'view', 'own', 'profile:view:own', 'View own profile'),
    ('profile', 'edit', 'own', 'profile:edit:own', 'Edit own profile'),
    ('profile', 'read', 'own', 'profile:read:own', 'Read own profile'),
    ('profile', 'update', 'own', 'profile:update:own', 'Update own profile')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Auth permissions
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('auth', 'login', 'public', 'auth:login:public', 'User login'),
    ('auth', 'logout', 'own', 'auth:logout:own', 'User logout'),
    ('auth', 'refresh', 'own', 'auth:refresh:own', 'Refresh authentication')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Other essential permissions
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('company', 'read', 'own', 'company:read:own', 'Read own company information'),
    ('party', 'read', 'own', 'party:read:own', 'Read own party information'),
    ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter information'),
    ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter information'),
    ('file', 'upload', 'own', 'file:upload:own', 'Upload own files'),
    ('file', 'read', 'own', 'file:read:own', 'Read own files'),
    ('notification', 'read', 'own', 'notification:read:own', 'Read own notifications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- ========================================
-- PART 4: MAP PERMISSIONS TO ROLES
-- ========================================

DO $$
DECLARE
    basic_client_id UUID;
    system_admin_id UUID;
    provider_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO basic_client_id FROM roles WHERE name = 'Basic Client';
    SELECT id INTO system_admin_id FROM roles WHERE name = 'System Administrator';
    SELECT id INTO provider_id FROM roles WHERE name = 'Individual Provider';

    -- Basic Client: Essential permissions including contracts
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT basic_client_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own', 
        'contract:generate:own', 'contract:download:own', 'contract:submit:own',
        'company:read:own', 'party:read:own',
        'file:upload:own', 'file:read:own',
        'notification:read:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Individual Provider: All basic client permissions + provider-specific
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT provider_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own',
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'contract:submit:own',
        'promoter:read:own', 'promoter:manage:own',
        'company:read:own', 'party:read:own',
        'file:upload:own', 'file:read:own',
        'notification:read:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- System Administrator: ALL permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT system_admin_id, p.id FROM permissions p
    ON CONFLICT (role_id, permission_id) DO NOTHING;

END $$;

-- ========================================
-- PART 5: ASSIGN ADMIN ROLE TO FIRST USER
-- ========================================

INSERT INTO user_role_assignments (user_id, role_id, is_active)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) as user_id,
    r.id as role_id,
    true as is_active
FROM roles r 
WHERE r.name = 'System Administrator'
ON CONFLICT DO NOTHING;

-- Refresh materialized view
SELECT refresh_user_permissions();

-- ========================================
-- VERIFICATION
-- ========================================

-- Show what was created
SELECT 
    '✅ Setup Complete!' as status,
    (SELECT COUNT(*) FROM roles) as roles_count,
    (SELECT COUNT(*) FROM permissions) as permissions_count,
    (SELECT COUNT(*) FROM role_permissions) as role_permission_mappings,
    (SELECT COUNT(*) FROM user_role_assignments WHERE is_active = true) as active_assignments;

-- Show the admin user
SELECT 
    '👤 Admin User' as info,
    u.email,
    r.name as role_name
FROM user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY ura.created_at DESC
LIMIT 1;

-- Verify contract permissions
SELECT 
    '🔍 Contract Permissions Created' as info,
    COUNT(*) as count
FROM permissions
WHERE resource = 'contract';

-- Show permissions for admin user
SELECT 
    '✓ Admin Permissions Sample' as info,
    permission_name,
    resource,
    action,
    scope
FROM user_permissions
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
AND resource IN ('contract', 'user', 'profile')
ORDER BY resource, action
LIMIT 10;

