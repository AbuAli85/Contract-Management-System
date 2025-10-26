-- Update user name for operations@falconeyegroup.net
-- From: Fahad alamri
-- To: Waqas Ahmad
-- Date: 2025-10-26

-- Update the auth.users raw_user_meta_data
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{full_name}',
    '"Waqas Ahmad"'
  ),
  updated_at = NOW()
WHERE email = 'operations@falconeyegroup.net'
  AND id = '947d9e41-8d7b-4604-978b-4cb2819b8794';

-- Also update the profiles table if it exists
UPDATE profiles
SET 
  full_name = 'Waqas Ahmad',
  updated_at = NOW()
WHERE id = '947d9e41-8d7b-4604-978b-4cb2819b8794';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  updated_at
FROM auth.users
WHERE email = 'operations@falconeyegroup.net';

-- Also check profiles table
SELECT 
  id,
  email,
  full_name,
  updated_at
FROM profiles
WHERE id = '947d9e41-8d7b-4604-978b-4cb2819b8794';

