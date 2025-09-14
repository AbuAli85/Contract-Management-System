-- ========================================
-- 🔍 CHECK CONSTRAINT AND FIX RBAC
-- ========================================
-- This script checks the constraint and then fixes the issue

-- ========================================
-- STEP 1: CHECK THE CONSTRAINT
-- ========================================

-- Check the exact constraint definition
SELECT 
    'Category constraint' as check_item,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rbac_roles'::regclass 
AND contype = 'c';

-- Check what categories are currently allowed
SELECT 
    'Current categories' as check_item,
    category 
FROM rbac_roles
GROUP BY category;

-- ========================================
-- STEP 2: FIX THE ISSUE
-- ========================================

-- Create the permission first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM rbac_permissions WHERE name = 'contract:read:own') THEN
        INSERT INTO rbac_permissions (resource, action, scope, name, description)
        VALUES ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts');
        RAISE NOTICE '✅ Created contract:read:own permission';
    ELSE
        RAISE NOTICE 'ℹ️ contract:read:own permission already exists';
    END IF;
END $$;

-- Create the role with a safe approach
DO $$
DECLARE
    role_id UUID;
    existing_category TEXT;
BEGIN
    -- Get an existing category to use
    SELECT DISTINCT category INTO existing_category FROM rbac_roles LIMIT 1;
    
    IF existing_category IS NULL THEN
        -- If no existing categories, try to create with 'client'
        BEGIN
            INSERT INTO rbac_roles (name, category, description)
            VALUES ('Platform Administrator', 'client', 'System administration and full access')
            RETURNING id INTO role_id;
            RAISE NOTICE '✅ Created Platform Administrator role with category: client';
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE '❌ Failed to create with client category, trying provider...';
            BEGIN
                INSERT INTO rbac_roles (name, category, description)
                VALUES ('Platform Administrator', 'provider', 'System administration and full access')
                RETURNING id INTO role_id;
                RAISE NOTICE '✅ Created Platform Administrator role with category: provider';
            EXCEPTION WHEN check_violation THEN
                RAISE NOTICE '❌ Failed to create with provider category, trying admin...';
                BEGIN
                    INSERT INTO rbac_roles (name, category, description)
                    VALUES ('Platform Administrator', 'admin', 'System administration and full access')
                    RETURNING id INTO role_id;
                    RAISE NOTICE '✅ Created Platform Administrator role with category: admin';
                EXCEPTION WHEN check_violation THEN
                    RAISE EXCEPTION '❌ All category attempts failed. Please check the constraint manually.';
                END;
            END;
        END;
    ELSE
        -- Use existing category
        INSERT INTO rbac_roles (name, category, description)
        VALUES ('Platform Administrator', existing_category, 'System administration and full access')
        ON CONFLICT (name) DO UPDATE SET
            category = EXCLUDED.category,
            description = EXCLUDED.description
        RETURNING id INTO role_id;
        RAISE NOTICE '✅ Created/Updated Platform Administrator role with existing category: %', existing_category;
    END IF;
    
    RAISE NOTICE 'Role ID: %', role_id;
END $$;

-- ========================================
-- STEP 3: ASSIGN PERMISSION TO ROLE
-- ========================================

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
-- STEP 4: ASSIGN USER TO ROLE
-- ========================================

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
-- STEP 5: REFRESH MATERIALIZED VIEW
-- ========================================

SELECT rbac_refresh_user_permissions_mv();

-- ========================================
-- STEP 6: VERIFICATION
-- ========================================

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
-- COMPLETION
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC Fix Complete!';
    RAISE NOTICE '🔒 User should now have contract:read:own permission';
    RAISE NOTICE '🚀 Test the contracts API endpoint at /api/contracts';
END $$;
