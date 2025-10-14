-- ============================================
-- DIAGNOSE LOGIN ISSUES
-- ============================================
-- This script helps diagnose common login problems

-- Check if users exist and their status
SELECT 
  '🔍 User Status Check' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users
FROM users;

-- Check recent login attempts (if audit logs exist)
SELECT 
  '🔍 Recent Login Attempts' as check_type,
  action,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt
FROM audit_logs 
WHERE action IN ('login', 'login_failed', 'auth_error')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY action
ORDER BY last_attempt DESC;

-- Check for users with common email patterns
SELECT 
  '🔍 Sample Users' as check_type,
  email,
  full_name,
  role,
  status,
  created_at
FROM users 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 5;

-- Check Supabase auth users (if accessible)
SELECT 
  '🔍 Auth Users Check' as check_type,
  'Check Supabase Dashboard > Authentication > Users for active accounts' as instructions;

-- Check environment configuration
SELECT 
  '🔍 Environment Check' as check_type,
  'Ensure these environment variables are set:' as instructions,
  'NEXT_PUBLIC_SUPABASE_URL' as var1,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY' as var2,
  'SUPABASE_SERVICE_ROLE_KEY' as var3;
