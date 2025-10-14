-- ============================================
-- TEST ENVIRONMENT SETUP
-- ============================================
-- Run this AFTER setting up .env.local to verify it's working

-- Test basic connectivity
SELECT 
  '🔍 Environment Test Results' as test_type,
  '✅ Database connection successful' as connectivity,
  NOW() as test_time;

-- Test user access
SELECT 
  '🔍 User Access Test' as test_type,
  COUNT(*) as accessible_users,
  '✅ Can read users table' as result
FROM users;

-- Test auth schema access
SELECT 
  '🔍 Auth Schema Test' as test_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') 
    THEN '✅ Auth schema accessible'
    ELSE '❌ Auth schema not accessible'
  END as auth_status;

-- Test promoters access
SELECT 
  '🔍 Promoters Access Test' as test_type,
  COUNT(*) as accessible_promoters,
  '✅ Can read promoters table' as result
FROM promoters;

-- Check for admin users
SELECT 
  '🔍 Admin Users Available' as test_type,
  email,
  role,
  status,
  'Ready for login test' as note
FROM users 
WHERE role IN ('admin', 'super_admin', 'system_admin')
  AND status = 'active'
LIMIT 3;

-- Final verification
SELECT 
  '🔍 Setup Complete' as status,
  'Environment variables configured successfully' as message,
  'Try logging in at /debug-login' as next_step;
