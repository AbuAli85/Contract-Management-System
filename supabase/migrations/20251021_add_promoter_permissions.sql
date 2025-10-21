-- Add promoter permissions to the database
-- This migration ensures admin users can access the /api/promoters endpoint

-- Step 1: Insert promoter permissions if they don't exist
INSERT INTO permissions (name, description, resource, action, scope)
VALUES 
  ('promoter:read:own', 'View own promoters', 'promoter', 'read', 'own'),
  ('promoter:manage:own', 'Manage own promoters', 'promoter', 'manage', 'own'),
  ('promoter:read:all', 'View all promoters', 'promoter', 'read', 'all'),
  ('promoter:manage:all', 'Manage all promoters', 'promoter', 'manage', 'all')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Get the admin role ID
DO $$
DECLARE
  v_admin_role_id uuid;
  v_permission_id uuid;
BEGIN
  -- Get admin role
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  IF v_admin_role_id IS NULL THEN
    RAISE NOTICE 'Admin role not found, skipping permission assignment';
    RETURN;
  END IF;

  -- Attach promoter permissions to admin role
  FOR v_permission_id IN 
    SELECT id FROM permissions 
    WHERE name IN ('promoter:read:own', 'promoter:manage:own', 'promoter:read:all', 'promoter:manage:all')
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_admin_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Promoter permissions added to admin role successfully';
END $$;

-- Step 3: Refresh the materialized view if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'rbac_user_permissions_mv'
  ) THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY rbac_user_permissions_mv;
    RAISE NOTICE 'Materialized view refreshed';
  END IF;
END $$;

