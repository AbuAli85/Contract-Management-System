-- ============================================================================
-- QUICK TEST: Convert ONE promoter by email (EASIEST METHOD)
-- ============================================================================
-- Just update the email below and run!
-- ============================================================================

-- ============================================================================
-- QUICK TEST: Convert ONE promoter by email (EASIEST METHOD)
-- ============================================================================
-- Test promoter: Muhammad Junaid (junaidshahid691@gmail.com)
-- ============================================================================

-- Step 1: Check if employee already exists
SELECT 
  'CHECKING EXISTING' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.employment_status
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM('junaidshahid691@gmail.com'))
LIMIT 1;

-- Step 2: Insert the employee (only if doesn't exist)
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
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM('junaidshahid691@gmail.com'))
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL  -- Only insert if doesn't exist
ORDER BY emp_pr.id, pr.id, p.created_at DESC
ON CONFLICT DO NOTHING;

-- Step 3: Show the result (newly created or existing)
SELECT 
  '✅ RESULT' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.employment_status,
  ee.created_at
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM('junaidshahid691@gmail.com'))
ORDER BY ee.created_at DESC
LIMIT 1;

