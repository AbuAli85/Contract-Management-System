-- ============================================================================
-- FIND UNLINKED PARTIES (Employers without Companies)
-- ============================================================================
-- This script helps identify which parties couldn't be linked to companies
-- and why (usually missing user account)
-- ============================================================================

-- 1. Parties without companies
SELECT 
  'Unlinked Party Details' as analysis_type,
  p.id,
  p.name_en,
  p.crn,
  p.contact_email,
  p.contact_person,
  p.role,
  p.overall_status,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE LOWER(TRIM(email)) = LOWER(TRIM(p.contact_email))) 
    THEN '❌ No user account found with this email'
    ELSE '✅ User account exists'
  END as user_status
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  )
ORDER BY p.name_en;

-- 2. Check if user exists for unlinked parties
SELECT 
  'User Account Check' as analysis_type,
  p.name_en as party_name,
  p.contact_email as party_email,
  u.email as user_email,
  u.id as user_id,
  u.full_name
FROM parties p
LEFT JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  )
ORDER BY p.name_en;

-- 3. Summary
SELECT 
  'Summary' as analysis_type,
  COUNT(*) as unlinked_parties,
  COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as parties_with_user_account,
  COUNT(CASE WHEN u.id IS NULL THEN 1 END) as parties_without_user_account
FROM parties p
LEFT JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

