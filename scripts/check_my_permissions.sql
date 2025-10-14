-- ========================================
-- 🔍 CHECK YOUR PERMISSIONS
-- ========================================
-- Run this to see if you have a role assigned
-- ========================================

-- 1. Show all users and their roles
SELECT 
    '👥 All Users and Roles' as info,
    u.email,
    r.name as role_name,
    r.category,
    ura.is_active,
    ura.created_at
FROM rbac_user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN rbac_roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY ura.created_at DESC;

-- 2. Show users WITHOUT roles
SELECT 
    '⚠️ Users WITHOUT Roles' as warning,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN rbac_user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
WHERE ura.id IS NULL
ORDER BY u.created_at;

-- 3. Check if materialized view has data
SELECT 
    '🔄 Materialized View Status' as info,
    COUNT(*) as total_permissions,
    COUNT(DISTINCT user_id) as users_with_permissions
FROM rbac_user_permissions_mv;

-- 4. Show permissions for each user
SELECT 
    '📋 User Permissions Summary' as info,
    u.email,
    COUNT(up.permission_name) as permission_count,
    STRING_AGG(DISTINCT up.role_name, ', ') as roles
FROM rbac_user_permissions_mv up
JOIN auth.users u ON up.user_id = u.id
GROUP BY u.email
ORDER BY permission_count DESC;

-- 5. Check specifically for contract:read:own permission
SELECT 
    '✓ Who has contract:read:own?' as check,
    u.email,
    up.role_name
FROM rbac_user_permissions_mv up
JOIN auth.users u ON up.user_id = u.id
WHERE up.permission_name = 'contract:read:own';

-- 6. Summary
SELECT 
    '📊 RBAC Summary' as section,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM rbac_roles) as total_roles,
    (SELECT COUNT(*) FROM rbac_permissions) as total_permissions,
    (SELECT COUNT(*) FROM rbac_user_role_assignments WHERE is_active = true) as active_role_assignments,
    (SELECT COUNT(DISTINCT user_id) FROM rbac_user_permissions_mv) as users_with_permissions,
    (SELECT COUNT(*) FROM rbac_permissions WHERE name = 'contract:read:own') as has_contract_read_permission;

