-- ============================================================================
-- DIAGNOSE: Why are only 6 employees being created?
-- ============================================================================

-- Check 1: How many unique profiles do the 25 promoters map to?
SELECT 
  'UNIQUE PROFILES' as check,
  COUNT(DISTINCT p.id) as total_promoters,
  COUNT(DISTINCT pr.id) as unique_profiles,
  COUNT(DISTINCT p.email) as unique_emails
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.email IS NOT NULL AND TRIM(p.email) != '';

-- Check 2: How many unique employer-employee pairs would be created?
SELECT 
  'UNIQUE PAIRS' as check,
  COUNT(DISTINCT p.id) as total_promoters,
  COUNT(DISTINCT (emp_pr.id, pr.id)) as unique_employer_employee_pairs
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '';

-- Check 3: How many pairs DON'T have employer_employee records yet?
SELECT 
  'MISSING RECORDS' as check,
  COUNT(DISTINCT p.id) as promoters_without_records,
  COUNT(DISTINCT (emp_pr.id, pr.id)) as unique_pairs_to_create
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL;

-- Check 4: Show which promoters share the same email/profile
SELECT 
  'EMAIL DUPLICATES' as check,
  p.email,
  COUNT(DISTINCT p.id) as promoters_count,
  COUNT(DISTINCT pr.id) as profiles_count,
  STRING_AGG(DISTINCT p.name_en, ', ') as promoter_names
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
GROUP BY p.email
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC;

-- Check 5: Show the exact pairs that should be inserted
SELECT 
  'DETAILED PAIRS TO INSERT' as check,
  p.id as promoter_id,
  p.name_en,
  p.email as promoter_email,
  pr.id as profile_id,
  pr.email as profile_email,
  pr.full_name as profile_name,
  emp_pr.id as employer_id,
  emp_pr.email as employer_email,
  c.id as company_id,
  CASE WHEN ee.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as record_status
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != ''
ORDER BY ee.id NULLS FIRST, p.name_en;

-- Check 6: Check for unique constraint conflicts
SELECT 
  'UNIQUE CONSTRAINT CHECK' as check,
  COUNT(*) as total_employer_employees,
  COUNT(DISTINCT (employer_id, employee_id)) as unique_pairs,
  COUNT(*) - COUNT(DISTINCT (employer_id, employee_id)) as potential_duplicates
FROM employer_employees
WHERE employer_id IS NOT NULL AND employee_id IS NOT NULL;

