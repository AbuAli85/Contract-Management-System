-- ============================================================================
-- LIST PROMOTERS THAT NEED REGISTRATION (NO PROFILES)
-- ============================================================================
-- This script lists all promoters that need to be registered (auth.users)
-- before they can have employer_employee records
-- ============================================================================

-- List promoters without profiles, grouped by employer
SELECT 
  pt.name_en as employer_name,
  pt.id as party_id,
  COUNT(DISTINCT p.id) as promoters_needing_registration,
  STRING_AGG(DISTINCT p.email, ', ' ORDER BY p.email) FILTER (
    WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  ) as promoter_emails
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
GROUP BY pt.id, pt.name_en
ORDER BY pt.name_en;

-- Detailed list of all promoters needing registration
SELECT 
  pt.name_en as employer_name,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.email as promoter_email,
  p.phone,
  p.mobile_number,
  p.job_title,
  p.department,
  p.status as promoter_status
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
ORDER BY pt.name_en, p.name_en;

-- Summary statistics
SELECT 
  'Total promoters needing registration' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )

UNION ALL

SELECT 
  'Promoters with profiles (ready for employer_employee)' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''

UNION ALL

SELECT 
  'Promoters with profiles AND employer_employee records' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

