-- ============================================
-- ENVIRONMENT VARIABLES CHECK
-- ============================================
-- This script helps verify environment variable configuration

-- Check if environment variables are accessible (limited check)
SELECT 
  '🔍 Environment Variables Check' as check_type,
  'Environment variables cannot be checked directly from SQL' as note,
  'Please verify these are set in your .env.local file:' as instructions;

-- Show sample users that should be able to log in
SELECT 
  '🔍 Test Users Available' as check_type,
  email,
  full_name,
  role,
  status,
  CASE 
    WHEN status = 'active' THEN '✅ Ready for login'
    WHEN status = 'pending' THEN '⚠️ Needs activation'
    WHEN status = 'inactive' THEN '❌ Deactivated'
    ELSE '❓ Unknown status'
  END as login_status
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- Check for any users with common admin emails
SELECT 
  '🔍 Admin Users Check' as check_type,
  email,
  role,
  status,
  created_at
FROM users 
WHERE role IN ('admin', 'super_admin', 'system_admin')
  OR email LIKE '%admin%'
  OR email LIKE '%test%'
ORDER BY created_at DESC
LIMIT 5;

-- Check recent user activity
SELECT 
  '🔍 Recent User Activity' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7_days,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as users_last_1_day
FROM users;

-- Environment setup instructions
SELECT 
  '🔍 Environment Setup Instructions' as check_type,
  'Required .env.local variables:' as instructions,
  'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co' as var1,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...' as var2,
  'SUPABASE_SERVICE_ROLE_KEY=eyJ...' as var3,
  'RBAC_ENFORCEMENT=enforce (or dry-run for testing)' as var4;
