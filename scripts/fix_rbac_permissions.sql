-- ========================================
-- 🛡️ RBAC PERMISSION FIX SCRIPT
-- ========================================
-- This script fixes the critical permission mismatches identified
-- by the RBAC drift analysis. Run this BEFORE production deployment.
-- 
-- Generated: 2025-08-11T20:47:15.863Z
-- Status: CRITICAL - Required for production

-- ========================================
-- ADD MISSING PERMISSIONS (P0 Critical)
-- ========================================

-- User Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('user', 'read', 'all', 'user:read:all', 'Read all users'),
    ('user', 'create', 'all', 'user:create:all', 'Create new users'),
    ('user', 'update', 'all', 'user:update:all', 'Update any user'),
    ('user', 'delete', 'all', 'user:delete:all', 'Delete users')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Contract Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts'),
    ('contract', 'create', 'own', 'contract:create:own', 'Create own contracts'),
    ('contract', 'update', 'own', 'contract:update:own', 'Update own contracts'),
    ('contract', 'generate', 'own', 'contract:generate:own', 'Generate own contracts'),
    ('contract', 'download', 'own', 'contract:download:own', 'Download own contracts'),
    ('contract', 'approve', 'all', 'contract:approve:all', 'Approve contracts'),
    ('contract', 'message', 'own', 'contract:message:own', 'Send contract messages')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Company Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('company', 'read', 'own', 'company:read:own', 'Read own company'),
    ('company', 'read', 'organization', 'company:read:organization', 'Read organization companies'),
    ('company', 'read', 'all', 'company:read:all', 'Read all companies'),
    ('company', 'manage', 'all', 'company:manage:all', 'Manage all companies')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Profile Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('profile', 'read', 'own', 'profile:read:own', 'Read own profile'),
    ('profile', 'update', 'own', 'profile:update:own', 'Update own profile'),
    ('profile', 'read', 'all', 'profile:read:all', 'Read all profiles')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Role Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('role', 'read', 'all', 'role:read:all', 'Read all roles'),
    ('role', 'assign', 'all', 'role:assign:all', 'Assign roles to users'),
    ('role', 'update', 'all', 'role:update:all', 'Update role definitions')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- System Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('permission', 'manage', 'all', 'permission:manage:all', 'Manage all permissions'),
    ('data', 'seed', 'all', 'data:seed:all', 'Seed system data'),
    ('data', 'import', 'all', 'data:import:all', 'Import data'),
    ('system', 'backup', 'all', 'system:backup:all', 'Create system backups')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Service Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('service', 'create', 'own', 'service:create:own', 'Create own services'),
    ('service', 'update', 'own', 'service:update:own', 'Update own services')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Promoter Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter data'),
    ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Party Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('party', 'read', 'own', 'party:read:own', 'Read own party data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Notification Operations
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('notification', 'read', 'own', 'notification:read:own', 'Read own notifications'),
    ('notification', 'read', 'organization', 'notification:read:organization', 'Read organization notifications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Analytics
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('analytics', 'read', 'all', 'analytics:read:all', 'Read analytics data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- ========================================
-- CLEAN UP UNUSED PERMISSIONS (P2 Low)
-- ========================================

-- Remove permissions that are seeded but not used in code
DELETE FROM permissions WHERE name IN (
    'user:view:own',
    'auth:login:public',
    'service:view:public',
    'discovery:search:public',
    'booking:view:own',
    'booking_lifecycle:start:provider',
    'communication:send:own',
    'call:initiate:own',
    'payment:view:own',
    'role:view:all',
    'system:view:all',
    'workflow:start:own'
);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check total permissions after fix
SELECT 'Total Permissions After Fix:' as info, COUNT(*) as count FROM permissions;

-- Check for any remaining mismatches
SELECT 'Permissions Used in Code but NOT Seeded:' as info, COUNT(*) as count
FROM (
    SELECT unnest(ARRAY[
        'user:read:all', 'user:create:all', 'user:delete:all', 'user:update:all',
        'promoter:read:own', 'party:read:own', 'notification:read:own', 'notification:read:organization',
        'contract:read:own', 'contract:create:own', 'company:read:own', 'company:read:organization',
        'company:read:all', 'profile:read:own', 'profile:update:own', 'role:read:all',
        'role:assign:all', 'permission:manage:all', 'service:create:own', 'service:update:own',
        'promoter:manage:own', 'company:manage:all', 'analytics:read:all', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'role:update:all', 'data:seed:all',
        'data:import:all', 'system:backup:all', 'profile:read:all', 'contract:message:own',
        'contract:approve:all'
    ]) as permission_name
) t
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p WHERE p.name = t.permission_name
);

-- ========================================
-- ROLE-PERMISSION ASSIGNMENTS
-- ========================================

-- Ensure critical roles have necessary permissions
-- This section should be customized based on your role structure

-- Example: Give Platform Administrator all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Platform Administrator'
ON CONFLICT DO NOTHING;

-- Example: Give System Administrator system-level permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.resource IN ('system', 'data', 'permission')
WHERE r.name = 'System Administrator'
ON CONFLICT DO NOTHING;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC Permission Fix Complete!';
    RAISE NOTICE '📊 Run "npm run rbac:drift" to verify no P0 issues remain';
    RAISE NOTICE '🔒 Run "npm run rbac:lint" to verify 100%% guard compliance';
    RAISE NOTICE '🚀 System ready for production after verification';
END $$;
