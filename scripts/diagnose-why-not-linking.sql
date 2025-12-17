-- ============================================================================
-- DIAGNOSE WHY PROMOTERS AREN'T BEING LINKED
-- ============================================================================

-- Check 1: How many promoters have all required data?
SELECT 
  'PROMOTERS WITH ALL DATA' as check_type,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';

-- Check 2: How many have matching profiles?
SELECT 
  'PROMOTERS WITH PROFILES' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';

-- Check 3: How many have employers with contact_email?
SELECT 
  'PROMOTERS WITH EMPLOYER CONTACT_EMAIL' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 4: How many have employers with profiles?
SELECT 
  'PROMOTERS WITH EMPLOYER PROFILES' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 5: How many CAN be linked (have both profiles)?
SELECT 
  'PROMOTERS THAT CAN BE LINKED' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 6: How many already have employer_employee records?
SELECT 
  'PROMOTERS ALREADY IN EMPLOYER_EMPLOYEES' as check_type,
  COUNT(DISTINCT p.id) as count
FROM promoters p
INNER JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

-- Check 7: How many have employer_employee records but missing party_id/promoter_id?
SELECT 
  'EMPLOYER_EMPLOYEES MISSING PARTY_ID' as check_type,
  COUNT(*) as count
FROM employer_employees ee
INNER JOIN promoters p ON p.id = ee.promoter_id
WHERE ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

SELECT 
  'EMPLOYER_EMPLOYEES MISSING PROMOTER_ID' as check_type,
  COUNT(*) as count
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
WHERE ee.promoter_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Check 8: Show sample promoters that CAN be linked but aren't
SELECT 
  'SAMPLE: CAN LINK BUT NOT LINKED' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  p.employer_id as party_id,
  pt.contact_email as employer_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id,
  CASE WHEN ee.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as employer_employee_status
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON (
  ee.promoter_id = p.id 
  OR (ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id)
)
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
LIMIT 10;

-- Check 9: Show existing employer_employees that need updating
SELECT 
  'SAMPLE: NEEDS UPDATE' as check_type,
  ee.id as employer_employee_id,
  ee.employer_id,
  ee.employee_id,
  ee.party_id,
  ee.promoter_id,
  ee.company_id,
  p.id as promoter_id_from_promoters,
  p.employer_id as party_id_from_promoters
FROM employer_employees ee
INNER JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(emp_profile.email))
WHERE (ee.party_id IS NULL OR ee.promoter_id IS NULL)
  AND p.employer_id IS NOT NULL
LIMIT 10;

