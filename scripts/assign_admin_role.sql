-- ========================================
-- 🔐 QUICK FIX: Assign System Administrator Role
-- ========================================
-- This script assigns the System Administrator role to the first user
-- or a specific user by email
--
-- Usage:
-- 1. Run this script in Supabase SQL Editor
-- 2. It will automatically assign System Administrator role to the first user
-- 3. Or uncomment and modify the second query to assign to a specific email
--
-- ========================================

-- Option 1: Assign to the first user in the system (default)
INSERT INTO user_role_assignments (user_id, role_id, is_active)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) as user_id,
    r.id as role_id,
    true as is_active
FROM roles r 
WHERE r.name = 'System Administrator'
ON CONFLICT DO NOTHING;

-- Option 2: Assign to a specific user by email (UNCOMMENT and modify)
/*
INSERT INTO user_role_assignments (user_id, role_id, is_active)
SELECT 
    u.id as user_id,
    r.id as role_id,
    true as is_active
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'your-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
AND r.name = 'System Administrator'
ON CONFLICT DO NOTHING;
*/

-- Refresh the materialized view to apply changes
SELECT refresh_user_permissions();

-- Verify the assignment
SELECT 
    u.email,
    r.name as role_name,
    ura.is_active,
    ura.created_at
FROM user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
ORDER BY ura.created_at DESC
LIMIT 5;

-- Show count of permissions assigned
SELECT 
    u.email,
    COUNT(up.permission_name) as permission_count
FROM user_permissions up
JOIN auth.users u ON up.user_id = u.id
GROUP BY u.email
ORDER BY permission_count DESC;

