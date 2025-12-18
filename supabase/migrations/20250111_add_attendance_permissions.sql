-- Migration: Add Attendance Permissions
-- Date: 2025-01-11
-- Description: Add permissions for attendance management features (links, approval, office locations)

-- Determine which table names to use (rbac_* or legacy)
DO $$
DECLARE
  use_rbac_tables BOOLEAN;
  permissions_table TEXT;
  roles_table TEXT;
  role_permissions_table TEXT;
  employer_role_id UUID;
  manager_role_id UUID;
  admin_role_id UUID;
BEGIN
  -- Check if rbac_permissions table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rbac_permissions'
  ) INTO use_rbac_tables;

  IF use_rbac_tables THEN
    permissions_table := 'rbac_permissions';
    roles_table := 'rbac_roles';
    role_permissions_table := 'rbac_role_permissions';
  ELSE
    permissions_table := 'permissions';
    roles_table := 'roles';
    role_permissions_table := 'role_permissions';
  END IF;

  -- Add attendance permissions
  EXECUTE format('
    INSERT INTO %I (resource, action, scope, name, description, created_at) VALUES
      (''attendance'', ''read'', ''all'', ''attendance:read:all'', ''View all attendance records for company'', NOW()),
      (''attendance'', ''create'', ''all'', ''attendance:create:all'', ''Create attendance links and manage attendance'', NOW()),
      (''attendance'', ''approve'', ''all'', ''attendance:approve:all'', ''Approve or reject employee attendance records'', NOW())
    ON CONFLICT (name) DO UPDATE SET
      resource = EXCLUDED.resource,
      action = EXCLUDED.action,
      scope = EXCLUDED.scope,
      description = EXCLUDED.description;
  ', permissions_table);

  -- Get role IDs for employer, manager, and admin
  EXECUTE format('SELECT id FROM %I WHERE LOWER(name) = ''employer'' LIMIT 1', roles_table) INTO employer_role_id;
  EXECUTE format('SELECT id FROM %I WHERE LOWER(name) = ''manager'' LIMIT 1', roles_table) INTO manager_role_id;
  EXECUTE format('SELECT id FROM %I WHERE LOWER(name) = ''admin'' LIMIT 1', roles_table) INTO admin_role_id;

  -- Assign permissions to employer role
  IF employer_role_id IS NOT NULL THEN
    EXECUTE format('
      INSERT INTO %I (role_id, permission_id, created_at)
      SELECT $1, id, NOW()
      FROM %I
      WHERE name IN (''attendance:read:all'', ''attendance:create:all'', ''attendance:approve:all'')
      ON CONFLICT DO NOTHING;
    ', role_permissions_table, permissions_table) USING employer_role_id;
  END IF;

  -- Assign permissions to manager role
  IF manager_role_id IS NOT NULL THEN
    EXECUTE format('
      INSERT INTO %I (role_id, permission_id, created_at)
      SELECT $1, id, NOW()
      FROM %I
      WHERE name IN (''attendance:read:all'', ''attendance:create:all'', ''attendance:approve:all'')
      ON CONFLICT DO NOTHING;
    ', role_permissions_table, permissions_table) USING manager_role_id;
  END IF;

  -- Assign permissions to admin role
  IF admin_role_id IS NOT NULL THEN
    EXECUTE format('
      INSERT INTO %I (role_id, permission_id, created_at)
      SELECT $1, id, NOW()
      FROM %I
      WHERE name IN (''attendance:read:all'', ''attendance:create:all'', ''attendance:approve:all'')
      ON CONFLICT DO NOTHING;
    ', role_permissions_table, permissions_table) USING admin_role_id;
  END IF;
END $$;
