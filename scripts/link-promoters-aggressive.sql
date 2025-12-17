-- ============================================================================
-- AGGRESSIVE PROMOTER LINKING
-- ============================================================================
-- This script aggressively links promoters by:
-- 1. Updating ALL existing employer_employees that match promoters
-- 2. Creating new records for any linkable promoters
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE ALL EXISTING RECORDS (AGGRESSIVE)
-- ============================================================================

-- Update ALL employer_employees with promoter_id where employee email matches promoter email
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  party_id = COALESCE(ee.party_id, subq.party_id),
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT 
    ee.id as employer_employee_id,
    p.id as promoter_id,
    p.employer_id as party_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN profiles pr ON pr.id = ee.employee_id
  INNER JOIN promoters p ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE p.employer_id IS NOT NULL
) subq
WHERE ee.id = subq.employer_employee_id
  AND (ee.promoter_id IS NULL OR ee.party_id IS NULL OR ee.company_id IS NULL);

-- Update ALL employer_employees with party_id from promoters
UPDATE employer_employees ee
SET 
  party_id = subq.party_id,
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT 
    ee.id as employer_employee_id,
    p.employer_id as party_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN promoters p ON p.id = ee.promoter_id
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE p.employer_id IS NOT NULL
    AND ee.party_id IS NULL
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
-- STEP 2: CREATE NEW RECORDS (AGGRESSIVE - IGNORE EXISTING)
-- ============================================================================

-- First, try to insert for promoters with profiles (both employer and employee)
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
-- STEP 3: FINAL UPDATE PASS (CATCH EVERYTHING)
-- ============================================================================

-- Update any remaining records that might have been missed
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
  'FINAL COUNTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL) as with_party_id,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as with_promoter_id,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id IS NOT NULL) as with_company_id,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL AND promoter_id IS NOT NULL) as fully_linked;

-- Show breakdown
SELECT 
  'BREAKDOWN' as check_type,
  'Promoters that can be linked' as category,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''

UNION ALL

SELECT 
  'BREAKDOWN',
  'Promoters actually linked',
  COUNT(DISTINCT p.id)
FROM promoters p
INNER JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

SELECT '✅ Aggressive linking complete!' as status;

