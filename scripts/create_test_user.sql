-- ============================================
-- CREATE TEST USER FOR LOGIN TESTING
-- ============================================
-- This script creates a test user to verify login functionality

-- Create a test user in the users table
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'test@thesmartpro.io',
  'Test User',
  'admin',
  'active',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  role = 'admin';

-- Verify the user was created
SELECT 
  '🔍 Test User Created' as result,
  email,
  full_name,
  role,
  status,
  created_at
FROM users 
WHERE email = 'test@thesmartpro.io';

-- Instructions for creating auth user
SELECT 
  '🔍 Next Steps' as instruction_type,
  'Go to Supabase Dashboard > Authentication > Users' as step1,
  'Click "Add user" and create user with email: test@thesmartpro.io' as step2,
  'Set password and confirm email' as step3,
  'Use these credentials to test login' as step4;

-- Alternative: Try to create auth user directly (may require service role)
-- Note: This might not work depending on your Supabase configuration
SELECT 
  '🔍 Alternative Method' as note,
  'If direct auth creation fails, use Supabase Dashboard method above' as instruction;
