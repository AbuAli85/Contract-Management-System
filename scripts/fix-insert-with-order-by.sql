-- ============================================================================
-- FIXED: Convert all 25 promoters with proper DISTINCT ON ordering
-- ============================================================================
-- The issue: DISTINCT ON requires ORDER BY, and we need to handle duplicates
-- ============================================================================

-- STEP 1: Show what will be inserted
SELECT 
  'WILL BE INSERTED' as status,
  COUNT(*) as total_promoters,
  COUNT(DISTINCT (emp_pr.id, pr.id)) as unique_pairs
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

-- STEP 2: INSERT with proper DISTINCT ON and ORDER BY
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
  CASE 
    WHEN p.status = 'active' THEN 'active'
    WHEN p.status = 'inactive' THEN 'inactive'
    WHEN p.status = 'terminated' THEN 'terminated'
    WHEN p.status = 'suspended' THEN 'suspended'
    ELSE 'active'
  END as employment_status,
  'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(pr.id::text, '-', ''), -4)) as employee_code,
  COALESCE(p.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
ORDER BY emp_pr.id, pr.id, p.created_at DESC  -- Required for DISTINCT ON
ON CONFLICT DO NOTHING;

-- STEP 3: Fix existing records with wrong employee_id
UPDATE employer_employees ee
SET 
  employee_id = pr.id,
  updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = p.id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND pr.id IS NOT NULL;

-- STEP 4: Final verification
SELECT 
  '✅ FINAL RESULTS' as status,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as valid_employees,
  COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as invalid_employees
FROM employer_employees ee
WHERE ee.employee_id IS NOT NULL;

-- Show newly created records
SELECT 
  'NEWLY CREATED' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.employment_status,
  ee.created_at
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
WHERE ee.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY ee.created_at DESC;

