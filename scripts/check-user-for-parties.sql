-- ============================================================================
-- CHECK USER ACCOUNTS FOR PARTY EMAILS
-- ============================================================================
-- This script checks which party emails have matching user accounts
-- ============================================================================

-- Check if user exists for luxsess2001@gmail.com
SELECT 
  'User Check for luxsess2001@gmail.com' as check_type,
  u.id,
  u.email,
  u.full_name,
  u.created_at
FROM profiles u
WHERE LOWER(TRIM(u.email)) = 'luxsess2001@gmail.com';

-- Check if user exists for chairman@falconeyegroup.net
SELECT 
  'User Check for chairman@falconeyegroup.net' as check_type,
  u.id,
  u.email,
  u.full_name,
  u.created_at
FROM profiles u
WHERE LOWER(TRIM(u.email)) = 'chairman@falconeyegroup.net';

-- Summary: Which party emails have users
SELECT 
  p.contact_email,
  COUNT(*) as party_count,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))) 
    THEN '✅ User exists'
    ELSE '❌ No user account'
  END as user_status
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND p.contact_email IS NOT NULL
GROUP BY p.contact_email
ORDER BY party_count DESC;

