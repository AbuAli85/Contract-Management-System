-- ========================================
-- Assign Admin Role to Current User
-- ========================================

-- Step 1: Show your current user info
SELECT 'Your user info:' as step,
       id as user_id,
       email,
       full_name,
       role as profile_role
FROM profiles
WHERE id = auth.uid();

-- Step 2: Show admin role info
SELECT 'Admin role info:' as step,
       id as role_id,
       name as role_name,
       category,
       description
FROM roles
WHERE name = 'admin';

-- Step 3: Check current role assignments
SELECT 'Current role assignments:' as step,
       r.name as role_name,
       ura.is_active,
       ura.created_at,
       ura.valid_until
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE p.id = auth.uid()
ORDER BY ura.created_at DESC;

-- Step 4: Find your user ID (if auth.uid() doesn't work)
-- Replace 'YOUR_EMAIL@example.com' with your actual email
SELECT 'Find your user ID:' as step,
       id as user_id,
       email,
       full_name
FROM profiles
WHERE email = 'YOUR_EMAIL@example.com'  -- ⚠️ REPLACE WITH YOUR EMAIL
LIMIT 1;

-- Step 5: Assign admin role to your user
-- ⚠️ REPLACE 'YOUR_USER_ID_HERE' with the UUID from Step 4
DO $$
DECLARE
  v_admin_role_id UUID;
  v_user_id UUID := 'YOUR_USER_ID_HERE'::UUID;  -- ⚠️ REPLACE WITH YOUR USER ID
  v_existing_count INT;
BEGIN
  -- Get admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Check if already assigned
  SELECT COUNT(*) INTO v_existing_count
  FROM user_role_assignments
  WHERE user_id = v_user_id AND role_id = v_admin_role_id;
  
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Admin Role ID: %', v_admin_role_id;
  RAISE NOTICE 'Existing assignments: %', v_existing_count;
  
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found! Please create it first.';
  END IF;
  
  IF v_user_id = 'YOUR_USER_ID_HERE'::UUID THEN
    RAISE EXCEPTION 'Please replace YOUR_USER_ID_HERE with your actual user ID from Step 4!';
  END IF;
  
  -- Assign or update admin role
  IF v_existing_count > 0 THEN
    -- Update existing assignment
    UPDATE user_role_assignments
    SET is_active = TRUE,
        updated_at = NOW(),
        valid_until = NULL
    WHERE user_id = v_user_id AND role_id = v_admin_role_id;
    
    RAISE NOTICE '✅ Updated existing admin role assignment';
  ELSE
    -- Insert new assignment
    INSERT INTO user_role_assignments (user_id, role_id, is_active)
    VALUES (v_user_id, v_admin_role_id, TRUE);
    
    RAISE NOTICE '✅ Created new admin role assignment';
  END IF;
END $$;

-- Step 6: Verify the assignment
-- ⚠️ REPLACE 'YOUR_USER_ID_HERE' with the UUID from Step 4
SELECT 'Verification - Your role assignments:' as step,
       p.email,
       r.name as role_name,
       ura.is_active,
       ura.created_at,
       ura.updated_at
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE p.id = 'YOUR_USER_ID_HERE'::UUID  -- ⚠️ REPLACE WITH YOUR USER ID
ORDER BY ura.created_at DESC;

-- Step 7: Test permission check
-- ⚠️ REPLACE 'YOUR_USER_ID_HERE' with the UUID from Step 4
SELECT 'Final permission check:' as step,
       EXISTS (
         SELECT 1
         FROM user_role_assignments ura
         JOIN role_permissions rp ON ura.role_id = rp.role_id
         JOIN permissions perm ON rp.permission_id = perm.id
         WHERE ura.user_id = 'YOUR_USER_ID_HERE'::UUID  -- ⚠️ REPLACE WITH YOUR USER ID
         AND perm.name = 'system:admin:all'
         AND ura.is_active = TRUE
       ) as has_system_admin_permission;

-- Step 7: Refresh cache if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'user_permissions_cache'
  ) THEN
    PERFORM refresh_user_permissions_cache();
    RAISE NOTICE '✅ Cache refreshed';
  END IF;
END $$;
