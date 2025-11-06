-- ========================================
-- Quick Verification: Check Admin Setup
-- ========================================

-- 1. Verify permission exists
SELECT 
  id,
  resource,
  action,
  scope,
  name
FROM permissions
WHERE name = 'system:admin:all';

-- 2. Verify admin role has the permission
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action,
  p.scope
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
AND p.name = 'system:admin:all';

-- 3. Verify your user has admin role
SELECT 
  p.id as user_id,
  p.email,
  r.name as role_name,
  ura.is_active,
  ura.created_at
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
AND r.name = 'admin'
AND ura.is_active = TRUE;

-- 4. Check all your permissions
SELECT 
  p.id as user_id,
  p.email,
  array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
  array_agg(DISTINCT perm.name) FILTER (WHERE perm.name IS NOT NULL) as permissions
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.id = auth.uid()
GROUP BY p.id, p.email;

-- 5. Create user_has_permission function if it doesn't exist
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE ura.user_id = p_user_id
    AND perm.name = p_permission_name
    AND ura.is_active = TRUE
    AND (ura.valid_until IS NULL OR ura.valid_until > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Test the permission check function
SELECT 
  user_has_permission(auth.uid(), 'system:admin:all'::TEXT) as has_system_admin_permission;

-- 7. Alternative: Direct permission check (if function still has issues)
SELECT 
  EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE ura.user_id = auth.uid()
    AND perm.name = 'system:admin:all'
    AND ura.is_active = TRUE
  ) as has_permission_direct_check;

