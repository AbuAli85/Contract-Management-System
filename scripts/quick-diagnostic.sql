-- ============================================================================
-- QUICK DIAGNOSTIC - WHY ONLY 4 ARE LINKED
-- ============================================================================

-- Check 1: How many promoters CAN be linked (have both profiles)?
SELECT 
  'CAN BE LINKED' as check_type,
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

-- Check 2: How many already exist in employer_employees?
SELECT 
  'ALREADY EXIST' as check_type,
  COUNT(DISTINCT p.id) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 3: Show the 4 that ARE linked
SELECT 
  'CURRENTLY LINKED' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  pt.contact_email as employer_email,
  ee.id as employer_employee_id,
  ee.party_id,
  ee.promoter_id,
  ee.company_id
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Check 4: Show promoters that CAN be linked but AREN'T
SELECT 
  'CAN LINK BUT NOT LINKED' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  pt.contact_email as employer_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id,
  CASE WHEN ee.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as employer_employee_status
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
LIMIT 10;

-- Check 5: Check if there are employer_employees without promoter_id that should have it
SELECT 
  'EMPLOYER_EMPLOYEES MISSING PROMOTER_ID' as check_type,
  COUNT(*) as count
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
WHERE ee.promoter_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Check 6: Check if there are employer_employees without party_id that should have it
SELECT 
  'EMPLOYER_EMPLOYEES MISSING PARTY_ID' as check_type,
  COUNT(*) as count
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
WHERE ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

