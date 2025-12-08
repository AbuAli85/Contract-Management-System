-- ========================================
-- Check and Fix Admin Permissions
-- ========================================

-- Step 1: Check your current user ID and role
SELECT 
  id as user_id,
  email,
  full_name,
  role
FROM profiles
WHERE id = auth.uid();

-- Step 2: Check if you have the admin role assigned
SELECT 
  p.id as user_id,
  p.email,
  r.name as role_name,
  ura.is_active,
  ura.valid_until
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
AND r.name = 'admin'
AND (ura.is_active = TRUE OR ura.is_active IS NULL)
AND (ura.valid_until IS NULL OR ura.valid_until > NOW());

-- Step 3: Check if system:admin:all permission exists
SELECT 
  id,
  resource,
  action,
  scope,
  name
FROM permissions
WHERE name = 'system:admin:all' 
   OR (resource = 'system' AND action = 'admin' AND (scope = 'all' OR scope IS NULL));

-- Step 4: Check if admin role has system:admin:all permission
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
AND (p.name = 'system:admin:all' 
     OR (p.resource = 'system' AND p.action = 'admin' AND (p.scope = 'all' OR p.scope IS NULL)));

-- Step 5: Check your current permissions (direct query - works even if cache doesn't exist)
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
  array_agg(DISTINCT perm.name) FILTER (WHERE perm.name IS NOT NULL) as permissions
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.id = auth.uid()
GROUP BY p.id, p.email, p.full_name;

-- ========================================
-- FIX: Create system:admin:all permission if it doesn't exist
-- ========================================
INSERT INTO permissions (resource, action, scope, name, description)
VALUES ('system', 'admin', 'all', 'system:admin:all', 'Full system administration access')
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- ========================================
-- FIX: Assign system:admin:all to admin role
-- ========================================
DO $$
DECLARE
  v_admin_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Get system:admin:all permission ID
  SELECT id INTO v_permission_id FROM permissions 
  WHERE name = 'system:admin:all' 
     OR (resource = 'system' AND action = 'admin' AND (scope = 'all' OR scope IS NULL))
  LIMIT 1;
  
  -- Assign permission to admin role
  IF v_admin_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_admin_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE '✅ Permission system:admin:all assigned to admin role';
  ELSE
    RAISE NOTICE '❌ Could not find admin role or permission';
  END IF;
END $$;

-- ========================================
-- FIX: Assign admin role to your user (if not already assigned)
-- ========================================
DO $$
DECLARE
  v_admin_role_id UUID;
  v_user_id UUID;
BEGIN
  -- Get your user ID
  v_user_id := auth.uid();
  
  -- Get admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Assign admin role to your user
  IF v_admin_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO user_role_assignments (user_id, role_id, is_active)
    VALUES (v_user_id, v_admin_role_id, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = TRUE;
    
    RAISE NOTICE '✅ Admin role assigned to user %', v_user_id;
  ELSE
    RAISE NOTICE '❌ Could not find admin role or user. Admin role ID: %, User ID: %', v_admin_role_id, v_user_id;
  END IF;
END $$;

-- ========================================
-- Create user_permissions_cache if it doesn't exist
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'user_permissions_cache'
  ) THEN
    CREATE MATERIALIZED VIEW user_permissions_cache AS
    SELECT
      p.id as user_id,
      p.email,
      p.full_name,
      array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
      array_agg(DISTINCT perm.name) FILTER (WHERE perm.name IS NOT NULL) as permissions
    FROM profiles p
    LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
    LEFT JOIN roles r ON ura.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions perm ON rp.permission_id = perm.id
    GROUP BY p.id, p.email, p.full_name;
    
    CREATE UNIQUE INDEX idx_user_permissions_cache_user_id ON user_permissions_cache(user_id);
    
    RAISE NOTICE '✅ Created user_permissions_cache materialized view';
  ELSE
    RAISE NOTICE '✅ user_permissions_cache already exists';
  END IF;
END $$;

-- ========================================
-- Create refresh function if it doesn't exist
-- ========================================
CREATE OR REPLACE FUNCTION refresh_user_permissions_cache()
RETURNS void
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions_cache;
EXCEPTION WHEN undefined_table THEN
  REFRESH MATERIALIZED VIEW user_permissions_cache;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Refresh the permissions cache
-- ========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'user_permissions_cache'
  ) THEN
    PERFORM refresh_user_permissions_cache();
    RAISE NOTICE '✅ Permissions cache refreshed';
  ELSE
    RAISE NOTICE '⚠️ Cache does not exist yet, skipping refresh';
  END IF;
END $$;

-- ========================================
-- Final check: Verify your permissions (direct query)
-- ========================================
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
  array_agg(DISTINCT perm.name) FILTER (WHERE perm.name IS NOT NULL) as permissions
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.id = auth.uid()
GROUP BY p.id, p.email, p.full_name;
