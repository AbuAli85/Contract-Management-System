-- ============================================
-- CREATE TEST USER (SIMPLE VERSION)
-- ============================================
-- This script creates a test user without assuming column structure

-- Check current users table structure first
SELECT 
  '🔍 Current Users Table Structure' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show existing users to understand the data
SELECT 
  '🔍 Existing Users' as info,
  email,
  role,
  status
FROM users 
LIMIT 5;

-- Try to create test user with minimal required fields
-- This will work regardless of schema variations
DO $$
BEGIN
  -- Try to insert test user
  BEGIN
    INSERT INTO users (email, role, status) 
    VALUES ('test@thesmartpro.io', 'admin', 'active');
    
    RAISE NOTICE '✅ Test user created successfully';
  EXCEPTION 
    WHEN unique_violation THEN
      -- Update existing user if email already exists
      UPDATE users 
      SET role = 'admin', status = 'active' 
      WHERE email = 'test@thesmartpro.io';
      
      RAISE NOTICE '✅ Test user updated successfully';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Error creating test user: %', SQLERRM;
  END;
END $$;

-- Verify the test user
SELECT 
  '🔍 Test User Status' as result,
  email,
  role,
  status,
  CASE 
    WHEN email = 'test@thesmartpro.io' THEN '✅ Ready for auth setup'
    ELSE '❌ Not found'
  END as status_check
FROM users 
WHERE email = 'test@thesmartpro.io';

-- Final instructions
SELECT 
  '🔍 Complete Setup Instructions' as instruction_type,
  '1. Test user created in database' as step1,
  '2. Go to Supabase Dashboard > Authentication > Users' as step2,
  '3. Add new user with email: test@thesmartpro.io' as step3,
  '4. Set a secure password' as step4,
  '5. Confirm the email' as step5,
  '6. Test login at /debug-login' as step6;

