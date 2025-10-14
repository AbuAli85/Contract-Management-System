-- ========================================
-- 🔍 RBAC Status Check
-- ========================================
-- This script checks the current state of your RBAC system
-- and helps diagnose permission issues
--
-- Run this in Supabase SQL Editor to see:
-- - How many roles, permissions, and role assignments exist
-- - Which users have roles assigned
-- - Sample permissions for each role
--
-- ========================================

-- 1. Check if RBAC tables exist and have data
SELECT 'RBAC System Status' as check_type, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') 
        THEN '✅ Roles table exists'
        ELSE '❌ Roles table missing'
    END as status;

SELECT 'Total Roles' as metric, COUNT(*) as count FROM roles;
SELECT 'Total Permissions' as metric, COUNT(*) as count FROM permissions;
SELECT 'Total Role-Permission Mappings' as metric, COUNT(*) as count FROM role_permissions;
SELECT 'Total User Role Assignments' as metric, COUNT(*) as count FROM user_role_assignments;

-- 2. List all roles
SELECT 
    '📋 Available Roles' as info,
    name,
    category,
    description
FROM roles
ORDER BY category, name;

-- 3. Check for contract permissions
SELECT 
    '🔍 Contract Permissions' as info,
    name as permission_name,
    description
FROM permissions
WHERE resource = 'contract'
ORDER BY action, scope;

-- 4. List users and their assigned roles
SELECT 
    '👥 User Role Assignments' as info,
    u.email,
    r.name as role_name,
    r.category as role_category,
    ura.is_active,
    ura.created_at
FROM user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY u.email, r.name;

-- 5. Check materialized view status
SELECT 
    '🔄 Materialized View Status' as info,
    COUNT(*) as total_user_permissions,
    COUNT(DISTINCT user_id) as users_with_permissions
FROM user_permissions;

-- 6. Sample permissions by role (top 5 permissions per role)
SELECT 
    '🎯 Sample Permissions by Role' as info,
    r.name as role_name,
    p.name as permission_name,
    p.resource,
    p.action,
    p.scope
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Basic Client', 'System Administrator', 'Individual Provider')
AND p.resource IN ('contract', 'user', 'profile')
ORDER BY r.name, p.resource, p.action;

-- 7. Check if any user has contract:read:own permission
SELECT 
    '✓ Users with contract:read:own' as info,
    u.email,
    up.role_name
FROM user_permissions up
JOIN auth.users u ON up.user_id = u.id
WHERE up.permission_name = 'contract:read:own'
ORDER BY u.email;

-- 8. Identify users without any roles
SELECT 
    '⚠️ Users without roles' as info,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
WHERE ura.id IS NULL
ORDER BY u.created_at DESC;

-- 9. Check for contract permission consistency
SELECT 
    '🔬 Contract Permission Analysis' as info,
    r.name as role_name,
    COUNT(p.id) FILTER (WHERE p.resource = 'contract') as contract_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.category IN ('client', 'provider')
GROUP BY r.name
ORDER BY contract_permissions_count DESC;

-- 10. Summary
SELECT 
    '📊 Summary' as section,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM user_role_assignments WHERE is_active = true) as active_assignments,
    (SELECT COUNT(DISTINCT user_id) FROM user_permissions) as users_with_permissions,
    (SELECT COUNT(*) FROM permissions WHERE name = 'contract:read:own') as has_contract_read_permission;

