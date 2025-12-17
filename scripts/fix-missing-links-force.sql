-- ============================================================================
-- FORCE FIX MISSING PROMOTER LINKS
-- ============================================================================
-- This script uses a more direct approach to link the 20 missing promoters
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE ALL EXISTING RECORDS (BY EMPLOYEE_ID MATCH)
-- ============================================================================

-- Update any employer_employees that have matching employee_id but missing promoter_id
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
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE p.employer_id IS NOT NULL
    AND p.email IS NOT NULL
    AND TRIM(p.email) != ''
    AND ee.promoter_id IS NULL
) subq
WHERE ee.id = subq.employer_employee_id;

-- ============================================================================
-- STEP 2: CREATE NEW RECORDS FOR ALL LINKABLE PROMOTERS
-- ============================================================================

-- Insert for ALL 24 linkable promoters, using ON CONFLICT to update if exists
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
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 3: FINAL UPDATE - SET PROMOTER_ID FOR ANY MISSING
-- ============================================================================

-- One more pass to ensure promoter_id is set
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
  WHERE p.employer_id IS NOT NULL
    AND ee.promoter_id IS NULL
) subq
WHERE ee.id = subq.employer_employee_id;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

SELECT 
  'FINAL VERIFICATION' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as with_promoter_id,
  (SELECT COUNT(DISTINCT p.id)
   FROM promoters p
   INNER JOIN employer_employees ee ON ee.promoter_id = p.id
   WHERE p.employer_id IS NOT NULL) as promoters_linked,
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

SELECT '✅ Force fix complete!' as status;

