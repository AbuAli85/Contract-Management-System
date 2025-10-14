-- ========================================
-- 🛡️ RBAC SEED FOR PREFIXED TABLES (rbac_*)
-- ========================================
-- This script seeds the RBAC system that uses rbac_ prefixed tables
-- Run this if your tables are: rbac_roles, rbac_permissions, etc.
-- ========================================

-- ========================================
-- PART 1: SEED ROLES
-- ========================================

-- Client Roles
INSERT INTO rbac_roles (name, category, description) VALUES
    ('Basic Client', 'client', 'Basic client with limited booking capabilities'),
    ('Premium Client', 'client', 'Premium client with enhanced features'),
    ('Enterprise Client', 'client', 'Enterprise client with full feature access'),
    ('Client Administrator', 'client', 'Client organization administrator')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- Provider Roles
INSERT INTO rbac_roles (name, category, description) VALUES
    ('Individual Provider', 'provider', 'Individual service provider'),
    ('Provider Team Member', 'provider', 'Member of a provider team'),
    ('Provider Manager', 'provider', 'Manager of provider team or organization'),
    ('Provider Administrator', 'provider', 'Administrator of provider organization')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- Admin Roles
INSERT INTO rbac_roles (name, category, description) VALUES
    ('Support Agent', 'admin', 'Customer support agent'),
    ('Content Moderator', 'admin', 'Content moderation specialist'),
    ('Platform Administrator', 'admin', 'Platform-level administrator'),
    ('System Administrator', 'admin', 'System-level administrator with full access')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- ========================================
-- PART 2: SEED PERMISSIONS (CONTRACT FOCUSED)
-- ========================================

-- Contract permissions (THE CRITICAL ONES)
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
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
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
    ('user', 'view', 'own', 'user:view:own', 'View own user profile'),
    ('user', 'edit', 'own', 'user:edit:own', 'Edit own user profile'),
    ('user', 'view', 'all', 'user:view:all', 'View all users'),
    ('user', 'create', 'all', 'user:create:all', 'Create new users'),
    ('user', 'edit', 'all', 'user:edit:all', 'Edit any user'),
    ('user', 'delete', 'all', 'user:delete:all', 'Delete users'),
    ('profile', 'view', 'own', 'profile:view:own', 'View own profile'),
    ('profile', 'edit', 'own', 'profile:edit:own', 'Edit own profile'),
    ('profile', 'read', 'own', 'profile:read:own', 'Read own profile'),
    ('profile', 'update', 'own', 'profile:update:own', 'Update own profile'),
    ('profile', 'view', 'all', 'profile:view:all', 'View all profiles'),
    ('profile', 'read', 'all', 'profile:read:all', 'Read all profiles'),
    ('profile', 'update', 'all', 'profile:update:all', 'Update any profile')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Auth permissions
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
    ('auth', 'login', 'public', 'auth:login:public', 'User login'),
    ('auth', 'logout', 'own', 'auth:logout:own', 'User logout'),
    ('auth', 'refresh', 'own', 'auth:refresh:own', 'Refresh authentication'),
    ('auth', 'impersonate', 'all', 'auth:impersonate:all', 'Impersonate other users')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Company, Party, Promoter permissions
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
    ('company', 'read', 'own', 'company:read:own', 'Read own company information'),
    ('company', 'read', 'organization', 'company:read:organization', 'Read organization company information'),
    ('company', 'read', 'all', 'company:read:all', 'Read all company information'),
    ('company', 'manage', 'all', 'company:manage:all', 'Manage all companies'),
    ('party', 'read', 'own', 'party:read:own', 'Read own party information'),
    ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter information'),
    ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter information')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- File & Notification permissions
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
    ('file', 'upload', 'own', 'file:upload:own', 'Upload own files'),
    ('file', 'read', 'own', 'file:read:own', 'Read own files'),
    ('file', 'delete', 'own', 'file:delete:own', 'Delete own files'),
    ('file', 'manage', 'all', 'file:manage:all', 'Manage all files'),
    ('notification', 'create', 'own', 'notification:create:own', 'Create own notifications'),
    ('notification', 'read', 'own', 'notification:read:own', 'Read own notifications'),
    ('notification', 'update', 'own', 'notification:update:own', 'Update own notifications'),
    ('notification', 'delete', 'own', 'notification:delete:own', 'Delete own notifications'),
    ('notification', 'manage', 'all', 'notification:manage:all', 'Manage all notifications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- System & Role permissions
INSERT INTO rbac_permissions (resource, action, scope, name, description) VALUES
    ('system', 'view', 'all', 'system:view:all', 'View system information'),
    ('system', 'settings', 'all', 'system:settings:all', 'Manage system settings'),
    ('system', 'logs', 'all', 'system:logs:all', 'View system logs'),
    ('role', 'view', 'all', 'role:view:all', 'View all roles'),
    ('role', 'update', 'all', 'role:update:all', 'Update role definitions and assignments'),
    ('role', 'manage', 'all', 'role:manage:all', 'Full role management'),
    ('permission', 'manage', 'all', 'permission:manage:all', 'Manage system permissions'),
    ('audit', 'read', 'all', 'audit:read:all', 'Read audit logs'),
    ('analytics', 'read', 'all', 'analytics:read:all', 'Read analytics data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- ========================================
-- PART 3: MAP PERMISSIONS TO ROLES
-- ========================================

DO $$
DECLARE
    basic_client_id UUID;
    premium_client_id UUID;
    enterprise_client_id UUID;
    provider_id UUID;
    provider_admin_id UUID;
    system_admin_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO basic_client_id FROM rbac_roles WHERE name = 'Basic Client';
    SELECT id INTO premium_client_id FROM rbac_roles WHERE name = 'Premium Client';
    SELECT id INTO enterprise_client_id FROM rbac_roles WHERE name = 'Enterprise Client';
    SELECT id INTO provider_id FROM rbac_roles WHERE name = 'Individual Provider';
    SELECT id INTO provider_admin_id FROM rbac_roles WHERE name = 'Provider Administrator';
    SELECT id INTO system_admin_id FROM rbac_roles WHERE name = 'System Administrator';

    -- Basic Client: Essential permissions
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT basic_client_id, p.id FROM rbac_permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own', 
        'contract:generate:own', 'contract:download:own', 'contract:submit:own', 'contract:message:own',
        'company:read:own', 'party:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Premium Client: Basic + additional
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT premium_client_id, p.id FROM rbac_permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own',
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'contract:submit:own', 'contract:message:own',
        'company:read:own', 'party:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Enterprise Client: Premium + organization access
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT enterprise_client_id, p.id FROM rbac_permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'user:view:all',
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own', 'profile:view:all', 'profile:read:all',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'contract:submit:own', 'contract:message:own',
        'company:read:own', 'company:read:organization', 'party:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Individual Provider: Provider-specific permissions
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT provider_id, p.id FROM rbac_permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own',
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'contract:submit:own', 'contract:message:own',
        'promoter:read:own', 'promoter:manage:own',
        'company:read:own', 'party:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Provider Administrator: Full provider permissions
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT provider_admin_id, p.id FROM rbac_permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'user:view:all', 'user:create:all',
        'profile:view:own', 'profile:edit:own', 'profile:read:own', 'profile:update:own', 'profile:view:all', 'profile:read:all',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own', 'contract:delete:own',
        'contract:generate:own', 'contract:download:own', 'contract:submit:own', 'contract:message:own', 'contract:approve:all',
        'promoter:read:own', 'promoter:manage:own',
        'company:read:own', 'company:read:all', 'party:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own', 'file:manage:all',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own', 'notification:manage:all'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- System Administrator: ALL permissions
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    SELECT system_admin_id, p.id FROM rbac_permissions p
    ON CONFLICT (role_id, permission_id) DO NOTHING;

END $$;

-- ========================================
-- PART 4: ASSIGN ADMIN ROLE TO FIRST USER
-- ========================================

-- Check if profiles table exists and has id column
DO $$
DECLARE
    first_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Try to get first user from auth.users
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO admin_role_id FROM rbac_roles WHERE name = 'System Administrator';
    
    IF first_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO rbac_user_role_assignments (user_id, role_id, is_active)
        VALUES (first_user_id, admin_role_id, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Refresh materialized view if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'rbac_user_permissions_mv') THEN
        PERFORM rbac_refresh_user_permissions_mv();
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show what was created
SELECT 
    '✅ Seed Complete!' as status,
    (SELECT COUNT(*) FROM rbac_roles) as roles_count,
    (SELECT COUNT(*) FROM rbac_permissions) as permissions_count,
    (SELECT COUNT(*) FROM rbac_role_permissions) as role_permission_mappings,
    (SELECT COUNT(*) FROM rbac_user_role_assignments WHERE is_active = true) as active_assignments;

-- Show the admin user
SELECT 
    '👤 Admin User' as info,
    u.email,
    r.name as role_name
FROM rbac_user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN rbac_roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY ura.created_at DESC
LIMIT 5;

-- Verify contract permissions
SELECT 
    '🔍 Contract Permissions Created' as info,
    COUNT(*) as count
FROM rbac_permissions
WHERE resource = 'contract';

-- Show sample permissions
SELECT 
    '📋 Sample Permissions' as info,
    name as permission_name,
    resource,
    action,
    scope
FROM rbac_permissions
WHERE resource IN ('contract', 'user', 'profile')
ORDER BY resource, action
LIMIT 15;

