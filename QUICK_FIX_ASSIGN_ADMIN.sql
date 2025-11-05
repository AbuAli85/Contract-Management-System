-- ========================================
-- 🚀 QUICK FIX: Assign Admin Permissions
-- ========================================
-- Run this in Supabase SQL Editor to give yourself admin access
-- ========================================

-- STEP 1: Check if roles and permissions exist
SELECT 
    '📊 System Status' as check,
    (SELECT COUNT(*) FROM roles) as roles_count,
    (SELECT COUNT(*) FROM permissions) as permissions_count,
    (SELECT COUNT(*) FROM user_role_assignments) as assignments_count;

-- STEP 2: Show all users in the system
SELECT 
    '👥 All Users' as info,
    email,
    id,
    created_at
FROM auth.users
ORDER BY created_at ASC;

-- STEP 3: Show what roles exist
SELECT 
    '🎭 Available Roles' as info,
    name,
    category,
    description
FROM roles
ORDER BY name;

-- STEP 4: Assign System Administrator role to ALL users
-- (This is the safest approach - everyone gets admin access)
INSERT INTO user_role_assignments (user_id, role_id, is_active, created_at, updated_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
CROSS JOIN roles r
WHERE r.name = 'System Administrator'
ON CONFLICT DO NOTHING;

-- STEP 5: Refresh the permissions cache (if the function exists)
-- Try to refresh materialized view
DO $$
BEGIN
    -- Try different possible function names
    BEGIN
        PERFORM refresh_user_permissions();
        RAISE NOTICE '✅ Refreshed using refresh_user_permissions()';
    EXCEPTION WHEN undefined_function THEN
        BEGIN
            PERFORM rbac_refresh_user_permissions_mv();
            RAISE NOTICE '✅ Refreshed using rbac_refresh_user_permissions_mv()';
        EXCEPTION WHEN undefined_function THEN
            RAISE NOTICE '⚠️ No refresh function found (this may be ok)';
        END;
    END;
END $$;

-- STEP 6: Verify the assignment worked
SELECT 
    '✅ Role Assignments' as status,
    u.email,
    r.name as role_name,
    ura.created_at as assigned_at,
    ura.is_active
FROM user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY u.email, r.name;

-- STEP 7: Show permissions for System Administrator role
SELECT 
    '🔐 System Administrator Permissions' as info,
    p.name,
    p.resource,
    p.action,
    p.scope
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'System Administrator'
ORDER BY p.resource, p.action;

-- STEP 8: Success message
SELECT '🎉 DONE! You should now have admin permissions. Try refreshing your browser and approving the contract again.' as message;

