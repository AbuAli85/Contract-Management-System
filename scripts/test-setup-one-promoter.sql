-- ============================================================================
-- TEST SETUP: Convert ONE promoter for testing
-- ============================================================================
-- Use this to test the attendance system with one promoter before rolling out
-- ============================================================================

-- STEP 1: Show available promoters that can be converted
SELECT 
  'AVAILABLE FOR TESTING' as status,
  p.id as promoter_id,
  p.name_en,
  p.email,
  pr.id as profile_id,
  pr.full_name as profile_name,
  pr.email as profile_email,
  emp_pr.id as employer_id,
  emp_pr.email as employer_email,
  CASE WHEN ee.id IS NOT NULL THEN '✅ Already exists' ELSE '🆕 Can create' END as employee_status
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
ORDER BY 
  CASE WHEN ee.id IS NULL THEN 0 ELSE 1 END,  -- Show "can create" first
  p.name_en
LIMIT 10;  -- Show top 10 options

-- ============================================================================
-- STEP 2: Convert ONE specific promoter (UPDATE THE ID BELOW)
-- ============================================================================
-- Replace 'YOUR_PROMOTER_ID_HERE' with the actual promoter ID from Step 1
-- ============================================================================

-- Example: Convert a specific promoter by ID
-- Uncomment and update the promoter_id:

/*
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
SELECT 
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
WHERE p.id = 'YOUR_PROMOTER_ID_HERE'  -- ⚠️ UPDATE THIS
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL  -- Only if doesn't exist
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- STEP 3: Convert by EMAIL (Easier - just update the email)
-- ============================================================================
-- Replace 'test-promoter@example.com' with the actual promoter email
-- ============================================================================

-- Example: Convert by email
-- Uncomment and update the email:

/*
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
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM('test-promoter@example.com'))  -- ⚠️ UPDATE THIS
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
ORDER BY emp_pr.id, pr.id, p.created_at DESC
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- STEP 4: Verify the test employee was created
-- ============================================================================

SELECT 
  '✅ TEST EMPLOYEE' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.employment_status,
  ee.created_at
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
WHERE ee.created_at >= NOW() - INTERVAL '10 minutes'  -- Created in last 10 minutes
ORDER BY ee.created_at DESC;

