-- ============================================================================
-- SIMPLE PROMOTER LINKING - FIX AND CREATE
-- ============================================================================
-- This script:
-- 1. Updates existing employer_employees with missing party_id/promoter_id
-- 2. Creates new employer_employees for promoters that can be linked
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE EXISTING RECORDS (FIX MISSING DATA)
-- ============================================================================

-- Update party_id from promoters
UPDATE employer_employees ee
SET 
  party_id = p.employer_id,
  updated_at = NOW()
FROM promoters p
WHERE ee.promoter_id = p.id
  AND ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Update promoter_id from promoters (by email match)
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  updated_at = NOW()
FROM (
  SELECT 
    ee.id as employer_employee_id,
    p.id as promoter_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  WHERE ee.promoter_id IS NULL
    AND p.employer_id IS NOT NULL
) subq
WHERE ee.id = subq.employer_employee_id;

-- Update party_id from promoters (by email match)
UPDATE employer_employees ee
SET 
  party_id = subq.party_id,
  updated_at = NOW()
FROM (
  SELECT 
    ee.id as employer_employee_id,
    p.employer_id as party_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  WHERE ee.party_id IS NULL
    AND p.employer_id IS NOT NULL
) subq
WHERE ee.id = subq.employer_employee_id;

-- Update company_id from party_id
UPDATE employer_employees ee
SET 
  company_id = c.id,
  updated_at = NOW()
FROM companies c
WHERE ee.party_id = c.party_id
  AND ee.company_id IS NULL;

-- ============================================================================
-- STEP 2: CREATE NEW RECORDS FOR LINKABLE PROMOTERS
-- ============================================================================

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
-- Must have employer party
INNER JOIN parties pt ON pt.id = p.employer_id
-- Must have employer profile (by contact_email)
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
-- Must have employee profile (by promoter email)
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
-- Get company if exists
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  -- Only create if doesn't exist
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.employee_id = emp_profile.id 
      AND ee.employer_id = emp_pr.id
  )
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 3: FINAL UPDATE PASS (CATCH ANY MISSING)
-- ============================================================================

-- Final update pass for any records that might have been created before
UPDATE employer_employees ee
SET 
  party_id = COALESCE(ee.party_id, subq.party_id),
  promoter_id = COALESCE(ee.promoter_id, subq.promoter_id),
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT 
    ee.id as employer_employee_id,
    p.employer_id as party_id,
    p.id as promoter_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE p.employer_id IS NOT NULL
    AND (ee.party_id IS NULL OR ee.promoter_id IS NULL OR ee.company_id IS NULL)
) subq
WHERE ee.id = subq.employer_employee_id;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

SELECT 
  'UPDATED RECORDS' as check_type,
  COUNT(*) as count
FROM employer_employees
WHERE party_id IS NOT NULL 
  AND promoter_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

SELECT 
  'FINAL COUNTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL) as with_party_id,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as with_promoter_id,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id IS NOT NULL) as with_company_id;

SELECT '✅ Simple linking complete!' as status;

