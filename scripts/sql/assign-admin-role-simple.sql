-- ========================================
-- Simple: Assign Admin Role by Email
-- ========================================
-- Replace 'your-email@example.com' with your actual email address

DO $$
DECLARE
  v_admin_role_id UUID;
  v_user_id UUID;
  v_user_email TEXT := 'luxsess2001@gmail.com';
BEGIN
  -- Get your user ID from email
  SELECT id INTO v_user_id 
  FROM profiles 
  WHERE email = v_user_email 
  LIMIT 1;
  
  -- Get admin role ID
  SELECT id INTO v_admin_role_id 
  FROM roles 
  WHERE name = 'admin' 
  LIMIT 1;
  
  -- Show what we found
  RAISE NOTICE 'Looking for user with email: %', v_user_email;
  RAISE NOTICE 'User ID found: %', v_user_id;
  RAISE NOTICE 'Admin Role ID: %', v_admin_role_id;
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found! Please check the email address.', v_user_email;
  END IF;
  
  -- Check if admin role exists
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found!';
  END IF;
  
  -- Assign admin role (insert or update)
  INSERT INTO user_role_assignments (user_id, role_id, is_active)
  VALUES (v_user_id, v_admin_role_id, TRUE)
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET 
    is_active = TRUE,
    updated_at = NOW(),
    valid_until = NULL;
  
  RAISE NOTICE '✅ Admin role assigned to user % (email: %)', v_user_id, v_user_email;
  
  -- Verify the assignment
  IF EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE ura.user_id = v_user_id
    AND perm.name = 'system:admin:all'
    AND ura.is_active = TRUE
  ) THEN
    RAISE NOTICE '✅ Verified: User now has system:admin:all permission!';
  ELSE
    RAISE WARNING '⚠️ Warning: Permission check failed. Please verify manually.';
  END IF;
END $$;

-- Refresh cache
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'user_permissions_cache'
  ) THEN
    PERFORM refresh_user_permissions_cache();
    RAISE NOTICE '✅ Cache refreshed';
  END IF;
END $$;
