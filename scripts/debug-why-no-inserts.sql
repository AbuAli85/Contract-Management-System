-- ============================================================================
-- DEBUG: Why didn't the INSERT create new records?
-- ============================================================================

-- Check 1: How many promoters match profiles?
SELECT 
  'PROMOTERS WITH PROFILES' as check_type,
  COUNT(DISTINCT p.id) as promoter_count,
  COUNT(DISTINCT pr.id) as unique_profile_count,
  COUNT(DISTINCT p.email) as unique_email_count
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.email IS NOT NULL AND TRIM(p.email) != '';

-- Check 2: How many have employers?
SELECT 
  'PROMOTERS WITH EMPLOYERS' as check_type,
  COUNT(DISTINCT p.id) as promoter_count,
  COUNT(DISTINCT emp_pr.id) as unique_employer_count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
WHERE pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '';

-- Check 3: How many have BOTH profile + employer?
SELECT 
  'PROMOTERS WITH BOTH' as check_type,
  COUNT(DISTINCT p.id) as promoter_count,
  COUNT(DISTINCT pr.id) as unique_profile_count,
  COUNT(DISTINCT emp_pr.id) as unique_employer_count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '';

-- Check 4: How many already have employer_employee records?
SELECT 
  'ALREADY HAVE RECORDS' as check_type,
  COUNT(DISTINCT p.id) as promoter_count,
  COUNT(DISTINCT ee.id) as existing_employee_count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != ''
  AND ee.id IS NOT NULL;

-- Check 5: How many DON'T have records (should be inserted)?
SELECT 
  'SHOULD BE INSERTED' as check_type,
  COUNT(DISTINCT p.id) as promoter_count,
  COUNT(DISTINCT (emp_pr.id, pr.id)) as unique_employer_employee_pairs
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL;

-- Check 6: Show the actual pairs that should be inserted
SELECT 
  'DETAILED: SHOULD INSERT' as check_type,
  p.id as promoter_id,
  p.name_en,
  p.email as promoter_email,
  pr.id as profile_id,
  pr.email as profile_email,
  pr.full_name as profile_name,
  emp_pr.id as employer_id,
  emp_pr.email as employer_email,
  c.id as company_id,
  ee.id as existing_employee_id
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
ORDER BY p.name_en;

