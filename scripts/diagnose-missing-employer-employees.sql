-- ============================================================================
-- DIAGNOSE MISSING EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================
-- This script identifies why employer_employee records weren't created
-- ============================================================================

-- Check 1: Promoters without matching profiles (by email)
SELECT 
  'Promoters without matching profiles' as issue_type,
  COUNT(DISTINCT p.id) as count,
  STRING_AGG(DISTINCT p.email, ', ') FILTER (WHERE p.email IS NOT NULL) as sample_emails
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )

UNION ALL

-- Check 2: Employer parties without matching profiles (by contact_email)
SELECT 
  'Employer parties without matching profiles' as issue_type,
  COUNT(DISTINCT pt.id) as count,
  STRING_AGG(DISTINCT pt.contact_email, ', ') FILTER (WHERE pt.contact_email IS NOT NULL) as sample_emails
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  )

UNION ALL

-- Check 3: Promoters with profiles but missing employer profiles
SELECT 
  'Promoters with profiles but missing employer profiles' as issue_type,
  COUNT(DISTINCT p.id) as count,
  STRING_AGG(DISTINCT p.email, ', ') FILTER (WHERE p.email IS NOT NULL) as sample_emails
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND (pt.contact_email IS NULL 
    OR TRIM(pt.contact_email) = ''
    OR NOT EXISTS (
      SELECT 1 FROM profiles emp_pr 
      WHERE LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
    )
  )

UNION ALL

-- Check 4: Promoters with both profiles but missing employer_employee records
SELECT 
  'Promoters with both profiles but missing employer_employee records' as issue_type,
  COUNT(DISTINCT p.id) as count,
  STRING_AGG(DISTINCT p.email, ', ') FILTER (WHERE p.email IS NOT NULL) as sample_emails
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee
    WHERE ee.employee_id = emp_profile.id
      AND ee.employer_id = emp_pr.id
  );

-- ============================================================================
-- DETAILED BREAKDOWN BY EMPLOYER
-- ============================================================================

SELECT 
  pt.name_en as employer_name,
  pt.id as party_id,
  pt.contact_email as party_contact_email,
  COUNT(DISTINCT p.id) as total_promoters,
  COUNT(DISTINCT CASE 
    WHEN p.email IS NOT NULL 
      AND TRIM(p.email) != ''
      AND EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email)))
    THEN p.id 
  END) as promoters_with_profiles,
  COUNT(DISTINCT CASE 
    WHEN pt.contact_email IS NOT NULL 
      AND TRIM(pt.contact_email) != ''
      AND EXISTS (SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email)))
    THEN pt.id 
  END) as has_employer_profile,
  COUNT(DISTINCT ee.id) as existing_employer_employee_records
FROM parties pt
LEFT JOIN promoters p ON p.employer_id = pt.id
  AND p.status = 'active'
LEFT JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
LEFT JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
LEFT JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
GROUP BY pt.id, pt.name_en, pt.contact_email
ORDER BY pt.name_en;

