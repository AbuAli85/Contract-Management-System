-- ============================================================================
-- LINK ALL AVAILABLE PROMOTERS
-- ============================================================================
-- This script links ALL promoters that have both:
-- 1. A matching profile (by email)
-- 2. An employer with a matching profile (by contact_email)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE EMPLOYER_EMPLOYEE RECORDS FOR ALL LINKABLE PROMOTERS
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
-- Join to get employer profile (from party contact_email) - MUST EXIST
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
-- Join to get employee profile (from promoter email) - MUST EXIST
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
-- Join to get company_id
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  -- Don't create if already exists
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.promoter_id = p.id
       OR (ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id)
  )
ORDER BY emp_pr.id, emp_profile.id, p.id
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = EXCLUDED.party_id,
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 2: UPDATE EXISTING RECORDS WITH MISSING DATA
-- ============================================================================

-- Update existing records with party_id if missing
UPDATE employer_employees ee
SET party_id = p.employer_id
FROM promoters p
WHERE ee.promoter_id = p.id
  AND ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Update existing records with promoter_id if missing
UPDATE employer_employees ee
SET promoter_id = p.id
FROM promoters p
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = pr.id
  AND ee.promoter_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Update existing records with company_id if missing
UPDATE employer_employees ee
SET company_id = c.id
FROM companies c
WHERE ee.party_id = c.party_id
  AND ee.company_id IS NULL;

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

SELECT 
  'LINKING RESULTS' as check_type,
  COUNT(*) as total_promoters_with_employer,
  COUNT(CASE WHEN p.email IS NOT NULL THEN 1 END) as promoters_with_email,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))) THEN 1 END) as promoters_with_profile,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id) THEN 1 END) as promoters_linked,
  COUNT(CASE WHEN p.email IS NOT NULL 
    AND EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email)))
    AND NOT EXISTS (SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id) THEN 1 END) as promoters_ready_but_not_linked
FROM promoters p
WHERE p.employer_id IS NOT NULL;

-- Show breakdown of why promoters aren't linked
SELECT 
  'BREAKDOWN' as check_type,
  'Promoters missing email' as category,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND (p.email IS NULL OR TRIM(p.email) = '')

UNION ALL

SELECT 
  'BREAKDOWN',
  'Promoters with email but no profile',
  COUNT(*)
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )

UNION ALL

SELECT 
  'BREAKDOWN',
  'Promoters with profile but employer missing contact_email',
  COUNT(*)
FROM promoters p
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND (pt.contact_email IS NULL OR TRIM(pt.contact_email) = '')

UNION ALL

SELECT 
  'BREAKDOWN',
  'Promoters with profile but employer missing profile',
  COUNT(*)
FROM promoters p
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles emp_pr WHERE LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  )

UNION ALL

SELECT 
  'BREAKDOWN',
  'Promoters successfully linked',
  COUNT(*)
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id
  );

SELECT '✅ Linking complete! Check results above.' as status;

