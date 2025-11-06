-- ========================================
-- Complete Fix: Assign Admin Permissions
-- ========================================

-- Step 1: Verify permission exists
SELECT 'Permission check:' as step, 
       id, name 
FROM permissions 
WHERE name = 'system:admin:all';

-- Step 2: Verify admin role exists
SELECT 'Admin role check:' as step,
       id, name 
FROM roles 
WHERE name = 'admin';

-- Step 3: Assign system:admin:all to admin role
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
  LIMIT 1;
  
  -- Debug output
  RAISE NOTICE 'Admin role ID: %', v_admin_role_id;
  RAISE NOTICE 'Permission ID: %', v_permission_id;
  
  -- Assign permission to admin role
  IF v_admin_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_admin_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE '✅ Permission system:admin:all assigned to admin role';
  ELSE
    RAISE NOTICE '❌ Error: Admin role ID: %, Permission ID: %', v_admin_role_id, v_permission_id;
  END IF;
END $$;

-- Step 4: Verify the assignment
SELECT 'Role-Permission assignment:' as step,
       r.name as role_name,
       p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
AND p.name = 'system:admin:all';

-- Step 5: Get your user ID
SELECT 'Your user ID:' as step, auth.uid() as user_id;

-- Step 6: Assign admin role to your user
DO $$
DECLARE
  v_admin_role_id UUID;
  v_user_id UUID;
BEGIN
  -- Get your user ID
  v_user_id := auth.uid();
  
  -- Get admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Debug output
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Admin role ID: %', v_admin_role_id;
  
  -- Assign admin role to your user
  IF v_admin_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO user_role_assignments (user_id, role_id, is_active)
    VALUES (v_user_id, v_admin_role_id, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE 
    SET is_active = TRUE, updated_at = NOW();
    
    RAISE NOTICE '✅ Admin role assigned to user %', v_user_id;
  ELSE
    RAISE NOTICE '❌ Error: User ID: %, Admin role ID: %', v_user_id, v_admin_role_id;
  END IF;
END $$;

-- Step 7: Verify your role assignment
SELECT 'Your role assignment:' as step,
       p.email,
       r.name as role_name,
       ura.is_active,
       ura.created_at
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
AND r.name = 'admin';

-- Step 8: Final permission check
SELECT 'Final permission check:' as step,
       EXISTS (
         SELECT 1
         FROM user_role_assignments ura
         JOIN role_permissions rp ON ura.role_id = rp.role_id
         JOIN permissions perm ON rp.permission_id = perm.id
         WHERE ura.user_id = auth.uid()
         AND perm.name = 'system:admin:all'
         AND ura.is_active = TRUE
       ) as has_system_admin_permission;

-- Step 9: Refresh cache if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'user_permissions_cache'
  ) THEN
    PERFORM refresh_user_permissions_cache();
    RAISE NOTICE '✅ Cache refreshed';
  END IF;
END $$;

