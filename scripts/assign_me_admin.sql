-- ========================================
-- 🔐 ASSIGN ME SYSTEM ADMINISTRATOR ROLE
-- ========================================
-- This will show you all users and let you assign admin to yourself
-- ========================================

-- STEP 1: Show who currently has permissions
SELECT 
    '✓ Users WITH Permissions' as status,
    u.email,
    STRING_AGG(DISTINCT up.role_name, ', ') as roles,
    COUNT(up.permission_name) as permission_count
FROM rbac_user_permissions_mv up
JOIN auth.users u ON up.user_id = u.id
GROUP BY u.email
ORDER BY permission_count DESC;

-- STEP 2: Show ALL users
SELECT 
    '👥 All Users in System' as info,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST;

-- STEP 3: Show who has role assignments (but maybe MV not refreshed)
SELECT 
    '📋 Current Role Assignments' as info,
    u.email,
    r.name as role_name,
    ura.created_at as assigned_at
FROM rbac_user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN rbac_roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY ura.created_at DESC;

-- STEP 4: Assign System Administrator to ALL users (safest approach)
-- This ensures everyone can access the system
INSERT INTO rbac_user_role_assignments (user_id, role_id, is_active)
SELECT 
    u.id as user_id,
    r.id as role_id,
    true as is_active
FROM auth.users u
CROSS JOIN rbac_roles r
WHERE r.name = 'System Administrator'
ON CONFLICT DO NOTHING;

-- STEP 5: Refresh materialized view
SELECT rbac_refresh_user_permissions_mv();

-- STEP 6: Verify it worked
SELECT 
    '✅ After Assignment' as status,
    u.email,
    r.name as role_name,
    COUNT(up.permission_name) as permission_count
FROM auth.users u
JOIN rbac_user_role_assignments ura ON u.id = ura.user_id
JOIN rbac_roles r ON ura.role_id = r.id
LEFT JOIN rbac_user_permissions_mv up ON u.id = up.user_id
WHERE ura.is_active = true
GROUP BY u.email, r.name
ORDER BY permission_count DESC;

-- STEP 7: Final check - show who has contract:read:own now
SELECT 
    '🔍 Who Can Read Contracts?' as check,
    u.email,
    up.role_name
FROM rbac_user_permissions_mv up
JOIN auth.users u ON up.user_id = u.id
WHERE up.permission_name = 'contract:read:own'
ORDER BY u.email;

