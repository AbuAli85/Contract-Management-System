-- ========================================
-- Diagnostic: Check Permission Chain
-- ========================================

-- Step 1: Check if permission exists
SELECT '1. Permission exists?' as check_step,
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result,
       COUNT(*) as count
FROM permissions
WHERE name = 'system:admin:all';

-- Step 2: Check if admin role exists
SELECT '2. Admin role exists?' as check_step,
       CASE WHEN id IS NOT NULL THEN 'YES' ELSE 'NO' END as result,
       1 as count,
       id as role_id
FROM roles
WHERE name = 'admin'
LIMIT 1;

-- Step 3: Check if permission is assigned to admin role
SELECT '3. Permission assigned to admin role?' as check_step,
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result,
       COUNT(*) as count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
AND p.name = 'system:admin:all';

-- Step 4: Check your user ID
SELECT '4. Your user ID' as check_step,
       auth.uid() as user_id,
       p.email,
       p.role as profile_role
FROM profiles p
WHERE p.id = auth.uid();

-- Step 5: Check if you have admin role assigned
SELECT '5. You have admin role assigned?' as check_step,
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result,
       COUNT(*) as count,
       r.name as role_name,
       ura.is_active,
       ura.valid_until
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
AND r.name = 'admin'
GROUP BY r.name, ura.is_active, ura.valid_until;

-- Step 6: Check ALL your role assignments
SELECT '6. All your role assignments' as check_step,
       r.name as role_name,
       ura.is_active,
       ura.valid_until,
       ura.created_at
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
ORDER BY ura.created_at DESC;

-- Step 7: Check ALL permissions for admin role
SELECT '7. All permissions for admin role' as check_step,
       p.name as permission_name,
       p.resource,
       p.action,
       p.scope
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
ORDER BY p.name;

-- Step 8: Full chain check (user -> role -> permission)
SELECT '8. Full permission chain check' as check_step,
       p.email as user_email,
       r.name as role_name,
       perm.name as permission_name,
       ura.is_active as role_active
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.id = auth.uid()
AND perm.name = 'system:admin:all'
AND ura.is_active = TRUE;

