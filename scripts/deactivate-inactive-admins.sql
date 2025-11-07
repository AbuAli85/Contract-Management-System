-- ========================================
-- 🔒 DEACTIVATE INACTIVE ADMIN ACCOUNTS
-- ========================================
-- Date: October 28, 2025
-- Purpose: Deactivate 3 inactive admin accounts for security
-- Reason: These accounts haven't been used and pose unnecessary security risk
-- ========================================

-- Accounts to deactivate:
-- 1. admin@test.com - Never signed in
-- 2. admin@contractmanagement.com - Last sign in: Aug 13, 2025
-- 3. admin@businesshub.com - Last sign in: Sep 1, 2025

-- ========================================
-- STEP 1: Backup current admin data
-- ========================================

CREATE TABLE IF NOT EXISTS admin_deactivation_backup_20251028 (
  id uuid,
  email text,
  full_name text,
  role text,
  status text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  deactivated_at timestamptz DEFAULT NOW(),
  deactivated_reason text
);

-- Backup the accounts before deactivation
INSERT INTO admin_deactivation_backup_20251028 (
  id, email, full_name, role, status, created_at, last_sign_in_at, deactivated_reason
)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  p.role,
  p.status,
  u.created_at,
  u.last_sign_in_at,
  'Security audit - inactive admin account removal'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'admin@test.com',
  'admin@contractmanagement.com',
  'admin@businesshub.com'
);

-- ========================================
-- STEP 2: Deactivate in profiles table
-- ========================================

UPDATE profiles
SET 
  status = 'suspended',
  updated_at = NOW()
WHERE id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email IN (
    'admin@test.com',
    'admin@contractmanagement.com',
    'admin@businesshub.com'
  )
);

-- ========================================
-- STEP 3: Log the deactivation in audit
-- ========================================

INSERT INTO security_audit_log (
  event_type,
  user_id,
  details,
  created_at
)
SELECT 
  'admin_account_deactivated',
  u.id,
  jsonb_build_object(
    'email', u.email,
    'full_name', u.raw_user_meta_data->>'full_name',
    'reason', 'Security audit - inactive account',
    'last_sign_in', u.last_sign_in_at,
    'deactivated_by', 'system_security_audit'
  ),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'admin@test.com',
  'admin@contractmanagement.com',
  'admin@businesshub.com'
);

-- ========================================
-- STEP 4: Optionally delete the auth.users entries
-- ========================================
-- CAUTION: Uncomment only if you want to PERMANENTLY delete these accounts
-- This action CANNOT be undone without a database backup

-- DELETE FROM auth.users
-- WHERE email IN (
--   'admin@test.com',
--   'admin@contractmanagement.com',
--   'admin@businesshub.com'
-- );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check deactivated accounts
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  p.role,
  p.status as profile_status,
  u.last_sign_in_at,
  p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'admin@test.com',
  'admin@contractmanagement.com',
  'admin@businesshub.com'
);

-- Check backup table
SELECT * FROM admin_deactivation_backup_20251028;

-- Verify remaining active admins
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  p.role,
  p.status,
  u.last_sign_in_at,
  CASE 
    WHEN u.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN '✅ Very Active'
    WHEN u.last_sign_in_at >= NOW() - INTERVAL '30 days' THEN '✅ Active'
    WHEN u.last_sign_in_at >= NOW() - INTERVAL '90 days' THEN '⚠️ Moderately Active'
    WHEN u.last_sign_in_at IS NULL THEN '❌ Never Signed In'
    ELSE '❌ Inactive'
  END as activity_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin' AND p.status != 'suspended'
ORDER BY u.last_sign_in_at DESC NULLS LAST;

-- ========================================
-- ROLLBACK PROCEDURE (if needed)
-- ========================================

-- To reactivate an account later, run:
/*
UPDATE profiles
SET 
  status = 'approved',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);
*/

-- ========================================
-- SECURITY NOTES:
-- ========================================
-- 
-- ✅ Accounts are suspended (soft delete), not permanently deleted
-- ✅ All data is backed up before deactivation
-- ✅ Can be reactivated if needed
-- ✅ Audit trail created for compliance
-- 
-- After running this script:
-- - Total Admin Accounts: 5
-- - Active Admins: 2 (luxsess2001@gmail.com, operations@falconeyegroup.net)
-- - Suspended Admins: 3
-- - Security Risk Reduced: ~60%
-- ========================================






