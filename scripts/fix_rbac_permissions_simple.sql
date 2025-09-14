-- ========================================
-- 🛡️ RBAC PERMISSION FIX SCRIPT (SIMPLE)
-- ========================================
-- This script fixes the critical permission issue for contracts access
-- 
-- Generated: 2025-08-19
-- Status: CRITICAL - Required for production

-- ========================================
-- STEP 1: ENSURE RBAC TABLES EXIST
-- ========================================

-- Check if rbac_permissions table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_permissions') THEN
        RAISE EXCEPTION 'rbac_permissions table does not exist. Please run the RBAC migration first.';
    END IF;
END $$;

-- ========================================
-- STEP 2: ADD THE CRITICAL PERMISSION
-- ========================================

-- Add the contract:read:own permission that's causing the 403 error
SELECT rbac_upsert_permission('contract', 'read', 'own', 'contract:read:own', 'Read own contracts');

-- ========================================
-- STEP 3: CREATE ADMIN ROLE
-- ========================================

-- Create Platform Administrator role (using 'admin' category as required by constraint)
SELECT rbac_upsert_role('Platform Administrator', 'System administration and full access', 'admin');

-- ========================================
-- STEP 4: ASSIGN PERMISSION TO ROLE
-- ========================================

-- Get the role and permission IDs
DO $$
DECLARE
    admin_role_id UUID;
    contract_read_perm_id UUID;
BEGIN
    -- Get Platform Administrator role ID
    SELECT id INTO admin_role_id FROM rbac_roles WHERE name = 'Platform Administrator';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Platform Administrator role not found';
    END IF;
    
    -- Get contract:read:own permission ID
    SELECT id INTO contract_read_perm_id FROM rbac_permissions WHERE name = 'contract:read:own';
    
    IF contract_read_perm_id IS NULL THEN
        RAISE EXCEPTION 'contract:read:own permission not found';
    END IF;
    
    -- Assign permission to role
    INSERT INTO rbac_role_permissions (role_id, permission_id)
    VALUES (admin_role_id, contract_read_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE '✅ Assigned contract:read:own permission to Platform Administrator role';
END $$;

-- ========================================
-- STEP 5: ASSIGN USER TO ROLE
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
        RAISE NOTICE '❌ User with email chairman@falconeyegroup.net not found. Please update the email in this script.';
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
    
    RAISE NOTICE '✅ Assigned Platform Administrator role to user %', user_profile_id;
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
        RAISE NOTICE '❌ User not found for verification';
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
    RAISE NOTICE '🚀 Test the contracts API endpoint at /api/contracts';
END $$;
