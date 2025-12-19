-- ============================================================================
-- CHECK REMAINING PROMOTERS THAT WEREN'T CONVERTED
-- ============================================================================
-- This script shows which promoters still need to be converted and why
-- ============================================================================

-- ============================================================================
-- CHECK 1: Promoters without matching profiles
-- ============================================================================

SELECT 
  'NO PROFILE MATCH' as reason,
  p.id as promoter_id,
  p.name_en,
  p.email as promoter_email,
  'No profile found with matching email' as issue
FROM promoters p
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
ORDER BY p.name_en;

-- ============================================================================
-- CHECK 2: Promoters without employer (party_id)
-- ============================================================================

SELECT 
  'NO EMPLOYER' as reason,
  p.id as promoter_id,
  p.name_en,
  p.email,
  'Promoter has no employer_id (party_id)' as issue
FROM promoters p
WHERE p.employer_id IS NULL
ORDER BY p.name_en;

-- ============================================================================
-- CHECK 3: Promoters where employer has no matching profile
-- ============================================================================

SELECT 
  'NO EMPLOYER PROFILE' as reason,
  p.id as promoter_id,
  p.name_en,
  p.email,
  pt.contact_email as employer_email,
  'Employer party has no matching profile' as issue
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
WHERE p.email IS NOT NULL
  AND pt.contact_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  )
ORDER BY p.name_en;

-- ============================================================================
-- CHECK 4: Promoters that already have employer_employee records
-- ============================================================================

SELECT 
  'ALREADY EXISTS' as reason,
  p.id as promoter_id,
  p.name_en,
  p.email,
  ee.id as employer_employee_id,
  'Already has employer_employee record' as issue
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND pt.contact_email IS NOT NULL
ORDER BY p.name_en;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  'SUMMARY' as check_type,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))) THEN 1 END) as has_profile,
  COUNT(CASE WHEN p.employer_id IS NOT NULL THEN 1 END) as has_employer,
  COUNT(CASE 
    WHEN p.employer_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email)))
    AND EXISTS (
      SELECT 1 FROM parties pt 
      INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
      WHERE pt.id = p.employer_id
    )
    THEN 1 
  END) as can_be_converted
FROM promoters p;

