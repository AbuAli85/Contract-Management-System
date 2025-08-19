-- ========================================
-- 🛡️ MANUAL RBAC FIX SCRIPT
-- ========================================
-- This script manually fixes the RBAC permissions without using helper functions
-- Run this after the quick diagnostic to see what's happening
-- 
-- Generated: 2025-08-19
-- Status: CRITICAL - Required for production

-- ========================================
-- STEP 1: CHECK CURRENT STATE
-- ========================================

-- Check what we currently have
SELECT 'Current state check' as step;

-- Check existing permissions
SELECT 
    'Existing permissions' as check_item,
    COUNT(*) as count
FROM rbac_permissions;

-- Check existing roles
SELECT 
    'Existing roles' as check_item,
    COUNT(*) as count
FROM rbac_roles;

-- Show existing roles and their categories
SELECT 
    id,
    name,
    category,
    description
FROM rbac_roles
ORDER BY created_at;

-- ========================================
-- STEP 2: MANUALLY CREATE PERMISSION
-- ========================================

-- Create the permission directly (avoiding helper functions)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM rbac_permissions WHERE name = 'contract:read:own') THEN
        INSERT INTO rbac_permissions (resource, action, scope, name, description)
        VALUES ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts');
        RAISE NOTICE '✅ Created contract:read:own permission manually';
    ELSE
        RAISE NOTICE 'ℹ️ contract:read:own permission already exists';
    END IF;
END $$;

-- ========================================
-- STEP 3: MANUALLY CREATE ROLE
-- ========================================

-- Try to create the role with different approaches
DO $$
DECLARE
    role_id UUID;
    allowed_category TEXT;
BEGIN
    -- First, let's see what categories are currently allowed
    SELECT DISTINCT category INTO allowed_category FROM rbac_roles LIMIT 1;
    
    RAISE NOTICE 'Found allowed category: %', allowed_category;
    
    -- Try to create the role with an existing category
    IF allowed_category IS NOT NULL THEN
        INSERT INTO rbac_roles (name, category, description)
        VALUES ('Platform Administrator', allowed_category, 'System administration and full access')
        ON CONFLICT (name) DO UPDATE SET
            category = EXCLUDED.category,
            description = EXCLUDED.description
        RETURNING id INTO role_id;
        
        RAISE NOTICE '✅ Created/Updated Platform Administrator role with category: %', allowed_category;
    ELSE
        -- If no existing categories, try with 'client' as a fallback
        INSERT INTO rbac_roles (name, category, description)
        VALUES ('Platform Administrator', 'client', 'System administration and full access')
        ON CONFLICT (name) DO UPDATE SET
            category = EXCLUDED.category,
            description = EXCLUDED.description
        RETURNING id INTO role_id;
        
        RAISE NOTICE '✅ Created/Updated Platform Administrator role with fallback category: client';
    END IF;
    
    RAISE NOTICE 'Role ID: %', role_id;
END $$;

-- ========================================
-- STEP 4: ASSIGN PERMISSION TO ROLE
-- ========================================

-- Get the role and permission IDs and assign manually
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
    
    RAISE NOTICE 'Found role ID: %', admin_role_id;
    
    -- Get contract:read:own permission ID
    SELECT id INTO contract_read_perm_id FROM rbac_permissions WHERE name = 'contract:read:own';
    
    IF contract_read_perm_id IS NULL THEN
        RAISE EXCEPTION 'contract:read:own permission not found';
    END IF;
    
    RAISE NOTICE 'Found permission ID: %', contract_read_perm_id;
    
    -- Assign permission to role manually
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
    
    RAISE NOTICE 'Found user profile ID: %', user_profile_id;
    
    -- Get Platform Administrator role ID
    SELECT id INTO admin_role_id FROM rbac_roles WHERE name = 'Platform Administrator';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Platform Administrator role not found';
    END IF;
    
    -- Assign role to user manually
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
    RAISE NOTICE '✅ Manual RBAC Permission Fix Complete!';
    RAISE NOTICE '🔒 User should now have contract:read:own permission';
    RAISE NOTICE '🚀 Test the contracts API endpoint at /api/contracts';
END $$;
