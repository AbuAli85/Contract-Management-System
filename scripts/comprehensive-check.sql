-- ============================================================================
-- COMPREHENSIVE CHECK - FULL DIAGNOSTIC
-- ============================================================================

-- Check 1: Total promoters with employer
SELECT 
  'TOTAL PROMOTERS WITH EMPLOYER' as check_type,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL;

-- Check 2: Promoters with email
SELECT 
  'PROMOTERS WITH EMAIL' as check_type,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';

-- Check 3: Promoters with profile
SELECT 
  'PROMOTERS WITH PROFILE' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';

-- Check 4: Promoters with employer contact_email
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

-- Check 5: Promoters with employer profile
SELECT 
  'PROMOTERS WITH EMPLOYER PROFILE' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 6: Promoters that CAN be linked (have both profiles)
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

-- Check 7: Currently linked promoters
SELECT 
  'CURRENTLY LINKED PROMOTERS' as check_type,
  COUNT(DISTINCT p.id) as count
FROM promoters p
INNER JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

-- Check 8: Promoters that CAN be linked but AREN'T
SELECT 
  'CAN LINK BUT NOT LINKED' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL;

-- Check 9: Show sample of promoters that CAN be linked but AREN'T
SELECT 
  'SAMPLE: CAN LINK BUT NOT LINKED' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  pt.contact_email as employer_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
LIMIT 5;

-- Check 10: Total employer_employees
SELECT 
  'TOTAL EMPLOYER_EMPLOYEES' as check_type,
  COUNT(*) as total,
  COUNT(CASE WHEN party_id IS NOT NULL THEN 1 END) as with_party_id,
  COUNT(CASE WHEN promoter_id IS NOT NULL THEN 1 END) as with_promoter_id,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company_id
FROM employer_employees;

