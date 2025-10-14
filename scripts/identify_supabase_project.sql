-- ============================================
-- IDENTIFY SUPABASE PROJECT
-- ============================================
-- This script helps identify your Supabase project details

-- Get basic project information
SELECT 
  '🔍 Project Identification' as check_type,
  'Current Database' as info_type,
  current_database() as database_name,
  current_user as current_user,
  inet_server_addr() as server_address,
  NOW() as current_time;

-- Check if we can access auth schema (indicates Supabase)
SELECT 
  '🔍 Supabase Confirmation' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') 
    THEN '✅ Supabase detected - auth schema exists'
    ELSE '❌ Not a Supabase project - auth schema missing'
  END as supabase_status;

-- Get table information to help identify project
SELECT 
  '🔍 Database Tables' as check_type,
  schemaname,
  tablename,
  'Table exists' as status
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
  AND tablename IN ('users', 'promoters', 'contracts')
ORDER BY schemaname, tablename;

-- Check user count to verify this is the right project
SELECT 
  '🔍 User Verification' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email LIKE '%thesmartpro%' THEN 1 END) as thesmartpro_users,
  COUNT(CASE WHEN email LIKE '%admin%' THEN 1 END) as admin_users,
  COUNT(CASE WHEN email LIKE '%test%' THEN 1 END) as test_users
FROM users;

-- Show sample users to help identify project
SELECT 
  '🔍 Sample Users' as check_type,
  email,
  full_name,
  role,
  status,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 5;

-- Instructions for getting credentials
SELECT 
  '🔍 How to Get Credentials' as instruction_type,
  '1. Go to https://supabase.com/dashboard' as step1,
  '2. Find project with users from above list' as step2,
  '3. Go to Settings → API' as step3,
  '4. Copy Project URL and API keys' as step4,
  '5. Create .env.local file with these values' as step5;
