-- ============================================
-- VERIFY SUPABASE CONNECTION
-- ============================================
-- This script helps verify that Supabase is properly connected

-- Test basic database connectivity
SELECT 
  '🔍 Database Connection Test' as test_type,
  '✅ Connected to Supabase database' as result,
  NOW() as current_time,
  version() as postgres_version;

-- Check if auth schema exists
SELECT 
  '🔍 Auth Schema Check' as test_type,
  schemaname,
  '✅ Auth schema exists' as result
FROM pg_tables 
WHERE schemaname = 'auth'
LIMIT 1;

-- Check if users table exists and has data
SELECT 
  '🔍 Users Table Check' as test_type,
  COUNT(*) as user_count,
  '✅ Users table accessible' as result
FROM users;

-- Check auth users (if accessible)
SELECT 
  '🔍 Auth Users Check' as test_type,
  'Check Supabase Dashboard > Authentication > Users' as instructions,
  'Look for confirmed users with matching emails' as note;

-- Check environment variable format
SELECT 
  '🔍 Environment Variable Format Check' as test_type,
  'NEXT_PUBLIC_SUPABASE_URL should look like: https://xxxxxxxxxxxxx.supabase.co' as url_format,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY should start with: eyJ' as key_format,
  'SUPABASE_SERVICE_ROLE_KEY should start with: eyJ' as service_key_format;

-- Test a simple query to verify permissions
SELECT 
  '🔍 Permissions Test' as test_type,
  '✅ Can read from users table' as result,
  COUNT(*) as accessible_users
FROM users
WHERE status = 'active';
