-- Simple Test Account Creation Script
-- Run this in Supabase SQL Editor

-- 1. First, let's check what we have
SELECT 'Current Auth Users' as info;
SELECT id, email, email_confirmed_at, raw_user_meta_data FROM auth.users;

SELECT 'Current Public Users' as info;
SELECT id, email, full_name, role, status FROM public.users;

-- 2. Clean up any existing test accounts
DELETE FROM auth.users WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');
DELETE FROM public.users WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');

-- 3. Create auth users with proper password hashes
-- Password: "password" (bcrypt hash)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'provider@test.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password"
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Test Provider", "role": "provider"}',
  'authenticated',
  'authenticated'
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  '$2a$10$zlCJgbDmMLxvuE2GaRhkTO6KhO/ld4rq4gJuHZOLn.uPRr0UNgPKG', -- "TestPass123!"
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Test User", "role": "provider"}',
  'authenticated',
  'authenticated'
),
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password"
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Test Admin", "role": "admin"}',
  'authenticated',
  'authenticated'
);

-- 4. Check if users table has the right constraint
DO $$ 
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Add new constraint that includes provider role
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
    
    RAISE NOTICE 'Role constraint updated successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- 5. Create corresponding public users
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  'Test Provider',
  'provider',
  'active',
  '+1234567890',
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  'test@test.com',
  'Test User',
  'provider',
  'active',
  '+1234567890',
  NOW(),
  NOW()
),
(
  '33333333-3333-3333-3333-333333333333',
  'admin@test.com',
  'Test Admin',
  'admin',
  'active',
  '+1234567890',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 6. Verify the accounts
SELECT 'Final Verification - Auth Users' as info;
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as confirmed,
  raw_user_meta_data->>'role' as meta_role,
  CASE 
    WHEN encrypted_password LIKE '$2a$%' THEN '✅ Valid Hash'
    WHEN encrypted_password LIKE '$2b$%' THEN '✅ Valid Hash'
    ELSE '❌ Invalid Hash'
  END as password_status
FROM auth.users 
WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');

SELECT 'Final Verification - Public Users' as info;
SELECT email, full_name, role, status FROM public.users 
WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');

-- Success message
SELECT '✅ Test accounts created successfully!' as status,
       'Use credentials: provider@test.com / password' as provider_login,
       'Use credentials: test@test.com / TestPass123!' as test_login,
       'Use credentials: admin@test.com / password' as admin_login;