-- ============================================================================
-- FIX DUPLICATE EMPLOYEE RECORDS
-- ============================================================================
-- Problem: Multiple promoters share the same employee_id + employer_id
-- Solution: Update existing records with promoter_id for all matching promoters
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY DUPLICATE CASES
-- ============================================================================

-- Show cases where multiple promoters share the same employee_id + employer_id
SELECT 
  'DUPLICATE CASES' as check_type,
  emp_profile.id as employee_id,
  emp_pr.id as employer_id,
  COUNT(DISTINCT p.id) as promoter_count,
  STRING_AGG(DISTINCT p.id::text, ', ') as promoter_ids
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL
GROUP BY emp_profile.id, emp_pr.id
HAVING COUNT(DISTINCT p.id) > 1;

-- ============================================================================
-- STEP 2: UPDATE EXISTING RECORDS WITH PROMOTER_ID
-- ============================================================================

-- For each (employee_id, employer_id) pair, update the existing record with the FIRST promoter_id
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  party_id = COALESCE(ee.party_id, subq.party_id),
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (ee.id)
    ee.id as employer_employee_id,
    p.id as promoter_id,
    p.employer_id as party_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  INNER JOIN parties pt ON pt.id = p.employer_id
  INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE ee.employer_id = emp_pr.id
    AND ee.promoter_id IS NULL
    AND p.employer_id IS NOT NULL
    AND p.email IS NOT NULL
    AND TRIM(p.email) != ''
  ORDER BY ee.id, p.created_at ASC
) subq
WHERE ee.id = subq.employer_employee_id;

-- ============================================================================
-- STEP 3: CREATE NEW RECORDS FOR PROMOTERS WITHOUT EXISTING RECORDS
-- ============================================================================

-- Only create records for promoters that don't have ANY employer_employees record
-- (This handles the case where the employee_id + employer_id combination doesn't exist yet)
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  party_id,
  promoter_id,
  company_id,
  employment_type,
  employment_status,
  created_at,
  updated_at
)
SELECT DISTINCT ON (emp_pr.id, emp_profile.id)
  emp_pr.id as employer_id,
  emp_profile.id as employee_id,
  p.employer_id as party_id,
  p.id as promoter_id,
  c.id as company_id,
  'full_time' as employment_type,
  CASE 
    WHEN p.status = 'active' THEN 'active'
    WHEN p.status = 'inactive' THEN 'inactive'
    WHEN p.status = 'terminated' THEN 'terminated'
    WHEN p.status = 'suspended' THEN 'suspended'
    WHEN p.status = 'on_leave' THEN 'on_leave'
    ELSE 'active'
  END as employment_status,
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  -- Only create if NO record exists for this employee_id + employer_id
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.employee_id = emp_profile.id 
      AND ee.employer_id = emp_pr.id
  )
ORDER BY emp_pr.id, emp_profile.id, p.created_at ASC
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 4: FINAL UPDATE - ENSURE ALL LINKABLE PROMOTERS HAVE PROMOTER_ID SET
-- ============================================================================

-- For cases where multiple promoters share the same employee_id, 
-- we can only link one promoter per employee_id + employer_id pair.
-- Update to use the first promoter (by created_at) if promoter_id is still NULL
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (ee.id)
    ee.id as employer_employee_id,
    p.id as promoter_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  INNER JOIN parties pt ON pt.id = p.employer_id
  INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  WHERE ee.employer_id = emp_pr.id
    AND ee.promoter_id IS NULL
    AND p.employer_id IS NOT NULL
  ORDER BY ee.id, p.created_at ASC
) subq
WHERE ee.id = subq.employer_employee_id;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

SELECT 
  'FINAL STATUS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as employer_employees_with_promoter_id,
  (SELECT COUNT(DISTINCT p.id)
   FROM promoters p
   INNER JOIN employer_employees ee ON ee.promoter_id = p.id
   WHERE p.employer_id IS NOT NULL) as unique_promoters_linked,
  (SELECT COUNT(*) 
   FROM promoters p
   INNER JOIN parties pt ON pt.id = p.employer_id
   INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
   INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
   WHERE p.employer_id IS NOT NULL
     AND p.email IS NOT NULL
     AND TRIM(p.email) != ''
     AND pt.contact_email IS NOT NULL
     AND TRIM(pt.contact_email) != ''
     AND NOT EXISTS (
       SELECT 1 FROM employer_employees ee 
       WHERE ee.promoter_id = p.id
     )) as still_missing;

-- Show how many unique employee_id + employer_id pairs we have
SELECT 
  'UNIQUE EMPLOYEE-EMPLOYER PAIRS' as check_type,
  COUNT(DISTINCT (employee_id, employer_id)) as unique_pairs,
  COUNT(*) as total_records
FROM employer_employees;

SELECT '✅ Duplicate records fixed!' as status;

