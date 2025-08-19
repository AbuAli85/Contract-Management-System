-- ========================================
-- 🛡️ RBAC PERMISSION FIX SCRIPT (CORRECTED)
-- ========================================
-- This script fixes the critical permission mismatches using the NEW rbac_* tables
-- 
-- Generated: 2025-08-19
-- Status: CRITICAL - Required for production

-- ========================================
-- STEP 1: ENSURE RBAC TABLES EXIST
-- ========================================

-- Check if rbac_permissions table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_permissions') THEN
        RAISE EXCEPTION 'rbac_permissions table does not exist. Please run the RBAC migration first.';
    END IF;
END $$;

-- ========================================
-- STEP 2: ADD MISSING PERMISSIONS
-- ========================================

-- Contract Operations
SELECT rbac_upsert_permission('contract', 'read', 'own', 'contract:read:own', 'Read own contracts');
SELECT rbac_upsert_permission('contract', 'create', 'own', 'contract:create:own', 'Create own contracts');
SELECT rbac_upsert_permission('contract', 'update', 'own', 'contract:update:own', 'Update own contracts');
SELECT rbac_upsert_permission('contract', 'generate', 'own', 'contract:generate:own', 'Generate own contracts');
SELECT rbac_upsert_permission('contract', 'download', 'own', 'contract:download:own', 'Download own contracts');
SELECT rbac_upsert_permission('contract', 'approve', 'all', 'contract:approve:all', 'Approve contracts');
SELECT rbac_upsert_permission('contract', 'message', 'own', 'contract:message:own', 'Send contract messages');

-- User Management
SELECT rbac_upsert_permission('user', 'read', 'all', 'user:read:all', 'Read all users');
SELECT rbac_upsert_permission('user', 'create', 'all', 'user:create:all', 'Create new users');
SELECT rbac_upsert_permission('user', 'update', 'all', 'user:update:all', 'Update any user');
SELECT rbac_upsert_permission('user', 'delete', 'all', 'user:delete:all', 'Delete users');

-- Company Management
SELECT rbac_upsert_permission('company', 'read', 'own', 'company:read:own', 'Read own company');
SELECT rbac_upsert_permission('company', 'read', 'organization', 'company:read:organization', 'Read organization companies');
SELECT rbac_upsert_permission('company', 'read', 'all', 'company:read:all', 'Read all companies');
SELECT rbac_upsert_permission('company', 'manage', 'all', 'company:manage:all', 'Manage all companies');

-- Profile Operations
SELECT rbac_upsert_permission('profile', 'read', 'own', 'profile:read:own', 'Read own profile');
SELECT rbac_upsert_permission('profile', 'update', 'own', 'profile:update:own', 'Update own profile');
SELECT rbac_upsert_permission('profile', 'read', 'all', 'profile:read:all', 'Read all profiles');

-- Role Management
SELECT rbac_upsert_permission('role', 'read', 'all', 'role:read:all', 'Read all roles');
SELECT rbac_upsert_permission('role', 'assign', 'all', 'role:assign:all', 'Assign roles to users');
SELECT rbac_upsert_permission('role', 'update', 'all', 'role:update:all', 'Update role definitions');

-- System Operations
SELECT rbac_upsert_permission('permission', 'manage', 'all', 'permission:manage:all', 'Manage all permissions');
SELECT rbac_upsert_permission('data', 'seed', 'all', 'data:seed:all', 'Seed system data');
SELECT rbac_upsert_permission('data', 'import', 'all', 'data:import:all', 'Import data');
SELECT rbac_upsert_permission('system', 'backup', 'all', 'system:backup:all', 'Create system backups');

-- Service Management
SELECT rbac_upsert_permission('service', 'create', 'own', 'service:create:own', 'Create own services');
SELECT rbac_upsert_permission('service', 'update', 'own', 'service:update:own', 'Update own services');

-- Promoter Operations
SELECT rbac_upsert_permission('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter data');
SELECT rbac_upsert_permission('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter data');

-- Party Operations
SELECT rbac_upsert_permission('party', 'read', 'own', 'party:read:own', 'Read own party data');

-- Notification Operations
SELECT rbac_upsert_permission('notification', 'read', 'own', 'notification:read:own', 'Read own notifications');
SELECT rbac_upsert_permission('notification', 'read', 'organization', 'notification:read:organization', 'Read organization notifications');

-- Analytics
SELECT rbac_upsert_permission('analytics', 'read', 'all', 'analytics:read:all', 'Read analytics data');

-- ========================================
-- STEP 3: ENSURE PLATFORM ADMINISTRATOR ROLE EXISTS
-- ========================================

SELECT rbac_upsert_role('Platform Administrator', 'System administration and full access', 'admin');

-- ========================================
-- STEP 4: ASSIGN ALL PERMISSIONS TO PLATFORM ADMINISTRATOR
-- ========================================

-- Get all permissions and assign them to Platform Administrator role
DO $$
DECLARE
    admin_role_id UUID;
    perm RECORD;
BEGIN
    -- Get Platform Administrator role ID
    SELECT id INTO admin_role_id FROM rbac_roles WHERE name = 'Platform Administrator';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Platform Administrator role not found';
    END IF;
    
    -- Assign all permissions to the role
    FOR perm IN SELECT id FROM rbac_permissions LOOP
        INSERT INTO rbac_role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Assigned % permissions to Platform Administrator role', (SELECT COUNT(*) FROM rbac_permissions);
END $$;

-- ========================================
-- STEP 5: ASSIGN USER TO PLATFORM ADMINISTRATOR ROLE
-- ========================================

-- Replace 'chairman@falconeyegroup.net' with the actual user email
DO $$
DECLARE
    user_profile_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get user profile ID by email
    SELECT id INTO user_profile_id FROM profiles WHERE email = 'chairman@falconeyegroup.net';
    
    IF user_profile_id IS NULL THEN
        RAISE NOTICE 'User with email chairman@falconeyegroup.net not found. Please update the email in this script.';
        RETURN;
    END IF;
    
    -- Get Platform Administrator role ID
    SELECT id INTO admin_role_id FROM rbac_roles WHERE name = 'Platform Administrator';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Platform Administrator role not found';
    END IF;
    
    -- Assign role to user
    INSERT INTO rbac_user_role_assignments (user_id, role_id, assigned_by, is_active)
    VALUES (user_profile_id, admin_role_id, user_profile_id, true)
    ON CONFLICT (user_id, role_id) DO UPDATE SET
        is_active = true,
        assigned_by = user_profile_id,
        assigned_at = NOW();
    
    RAISE NOTICE 'Assigned Platform Administrator role to user %', user_profile_id;
END $$;

-- ========================================
-- STEP 6: REFRESH MATERIALIZED VIEW
-- ========================================

-- Refresh the materialized view to include new permissions
SELECT rbac_refresh_user_permissions_mv();

-- ========================================
-- STEP 7: VERIFICATION
-- ========================================

-- Check if user has the required permission
DO $$
DECLARE
    user_profile_id UUID;
    has_permission BOOLEAN;
BEGIN
    -- Get user profile ID by email
    SELECT id INTO user_profile_id FROM profiles WHERE email = 'chairman@falconeyegroup.net';
    
    IF user_profile_id IS NULL THEN
        RAISE NOTICE 'User not found for verification';
        RETURN;
    END IF;
    
    -- Check if user has contract:read:own permission
    SELECT EXISTS (
        SELECT 1 FROM rbac_user_permissions_mv 
        WHERE user_id = user_profile_id 
        AND permission_name = 'contract:read:own'
    ) INTO has_permission;
    
    IF has_permission THEN
        RAISE NOTICE '✅ User % has contract:read:own permission', user_profile_id;
    ELSE
        RAISE NOTICE '❌ User % does NOT have contract:read:own permission', user_profile_id;
    END IF;
END $$;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC Permission Fix Complete!';
    RAISE NOTICE '🔒 User should now have contract:read:own permission';
    RAISE NOTICE '🚀 Test the contracts API endpoint';
END $$;
