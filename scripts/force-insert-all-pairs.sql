-- ============================================================================
-- FORCE INSERT: Create records for all unique employer-employee pairs
-- ============================================================================
-- This script will create records even if some promoters share the same email
-- ============================================================================

-- STEP 1: Show what will be inserted
SELECT 
  'WILL INSERT' as status,
  COUNT(DISTINCT (emp_pr.id, pr.id)) as unique_pairs_to_create,
  COUNT(DISTINCT p.id) as total_promoters
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL;

-- STEP 2: INSERT all unique pairs
-- Note: This will create 6 employees (not 25) because:
-- - 20 promoters share Operations@falconeyegroup.net (1 profile)
-- - 3 promoters share chairman@falconeyegroup.net (1 profile)
-- - 4 promoters have unique emails (4 profiles)
-- Total: 6 unique profiles = 6 employees
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  company_id,
  employment_type,
  employment_status,
  employee_code,
  created_at,
  updated_at
)
SELECT DISTINCT ON (emp_pr.id, pr.id)
  emp_pr.id as employer_id,
  pr.id as employee_id,
  c.id as company_id,
  'full_time' as employment_type,
  'active' as employment_status,
  'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(pr.id::text, '-', ''), -4)) as employee_code,
  NOW() as created_at,
  NOW() as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))  -- Already using LOWER() for case-insensitive match
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
ORDER BY emp_pr.id, pr.id, p.created_at DESC;

-- STEP 3: Verify results
SELECT 
  '✅ FINAL COUNT' as status,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as valid_employees
FROM employer_employees ee
WHERE ee.employee_id IS NOT NULL;

-- Show newly created
SELECT 
  'NEWLY CREATED' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.created_at
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
WHERE ee.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY ee.created_at DESC;

