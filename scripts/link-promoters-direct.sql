-- ============================================================================
-- DIRECT PROMOTER LINKING SCRIPT
-- ============================================================================
-- This script directly links promoters to employer_employees
-- Uses a simpler, more direct approach
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK WHAT CAN BE LINKED
-- ============================================================================

SELECT 
  'CAN BE LINKED' as check_type,
  COUNT(*) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- ============================================================================
-- STEP 2: CREATE EMPLOYER_EMPLOYEE RECORDS (SIMPLE APPROACH)
-- ============================================================================

-- Insert records for all promoters that can be linked
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
SELECT 
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
  -- Only create if doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE (ee.promoter_id = p.id)
       OR (ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id)
  )
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 3: UPDATE EXISTING RECORDS
-- ============================================================================

-- Update party_id for existing records
UPDATE employer_employees ee
SET party_id = p.employer_id
FROM promoters p
WHERE ee.promoter_id = p.id
  AND ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Update promoter_id for existing records
UPDATE employer_employees ee
SET promoter_id = p.id
FROM promoters p
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = pr.id
  AND ee.promoter_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Update company_id for existing records
UPDATE employer_employees ee
SET company_id = c.id
FROM companies c
WHERE ee.party_id = c.party_id
  AND ee.company_id IS NULL;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

SELECT 
  'LINKING RESULTS' as check_type,
  COUNT(*) as total_promoters_with_employer,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id) THEN 1 END) as promoters_linked
FROM promoters p
WHERE p.employer_id IS NOT NULL;

-- Show final counts
SELECT 
  'FINAL COUNTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL) as employer_employees_with_party_id,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as employer_employees_with_promoter_id,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id IS NOT NULL) as employer_employees_with_company_id;

SELECT '✅ Direct linking complete!' as status;

