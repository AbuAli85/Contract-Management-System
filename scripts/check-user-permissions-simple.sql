-- ========================================
-- Check User Permissions Diagnostic (LEGACY TABLES)
-- ========================================
-- Run this to see what permissions your users currently have

-- 1. Check if RBAC tables exist
SELECT 
  'Table Exists: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_role_assignments', 'profiles')
ORDER BY table_name;

-- 2. List all users/profiles
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN id IN (SELECT user_id FROM user_role_assignments WHERE is_active = TRUE) THEN '✅ Has roles'
    ELSE '❌ No roles'
  END as role_status
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. List all available roles
SELECT 
  id,
  name,
  category,
  description,
  (SELECT COUNT(*) FROM user_role_assignments WHERE role_id = roles.id AND is_active = TRUE) as user_count,
  (SELECT COUNT(*) FROM role_permissions WHERE role_id = roles.id) as permission_count
FROM roles
ORDER BY name;

-- 4. List all promoter-related permissions
SELECT 
  id,
  resource,
  action,
  scope,
  name as permission_string,
  description
FROM permissions
WHERE resource = 'promoter'
ORDER BY action, scope;

-- 5. Check which roles have promoter permissions
SELECT 
  r.name as role_name,
  r.category,
  p.resource,
  p.action,
  p.scope,
  p.name as permission_string
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'promoter'
ORDER BY r.name, p.action;

-- 6. Show full permission map for all users
SELECT 
  p.email,
  r.name as role_name,
  perm.resource,
  perm.action,
  perm.scope,
  perm.name as full_permission
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter' OR perm.resource IS NULL
ORDER BY p.email, perm.resource, perm.action;

-- 7. Find users without any roles (THESE WILL GET 403)
SELECT 
  p.id,
  p.email,
  p.created_at,
  '⚠️ NO ROLES - Will get 403 errors' as warning
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_role_assignments ura 
  WHERE ura.user_id = p.id AND ura.is_active = TRUE
)
ORDER BY p.created_at DESC;

-- 8. Find users without promoter:read:own permission (THESE WILL GET 403 ON /api/promoters)
SELECT DISTINCT
  p.id,
  p.email,
  '❌ Missing promoter:read:own permission' as issue
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions perm ON rp.permission_id = perm.id
  WHERE ura.user_id = p.id
    AND ura.is_active = TRUE
    AND perm.resource = 'promoter'
    AND perm.action = 'read'
    AND perm.scope = 'own'
)
ORDER BY p.email;

