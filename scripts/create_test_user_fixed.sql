-- ============================================
-- CREATE TEST USER (SCHEMA-COMPATIBLE)
-- ============================================
-- This script creates a test user compatible with your database schema

-- First, let's check what columns we actually have
SELECT 
  '🔍 Available Columns' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create test user with only existing columns
-- Note: Adjust the INSERT statement based on your actual schema
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  status
) VALUES (
  gen_random_uuid(),
  'test@thesmartpro.io',
  'Test User',
  'admin',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  role = 'admin';

-- Alternative: If the above doesn't work, try this minimal version
-- INSERT INTO users (email, role, status) 
-- VALUES ('test@thesmartpro.io', 'admin', 'active')
-- ON CONFLICT (email) DO UPDATE SET status = 'active', role = 'admin';

-- Verify the user was created
SELECT 
  '🔍 Test User Created' as result,
  email,
  full_name,
  role,
  status
FROM users 
WHERE email = 'test@thesmartpro.io';

-- Instructions for creating auth user
SELECT 
  '🔍 Next Steps' as instruction_type,
  '1. User created in database' as step1,
  '2. Go to Supabase Dashboard > Authentication > Users' as step2,
  '3. Click "Add user" and create user with email: test@thesmartpro.io' as step3,
  '4. Set password and confirm email' as step4,
  '5. Use these credentials to test login' as step5;

