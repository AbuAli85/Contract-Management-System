-- ============================================================================
-- QUICK STATUS CHECK - Returns results as query rows
-- ============================================================================
-- This version returns results as query rows instead of notices
-- ============================================================================

-- Overall Statistics
SELECT * FROM (
SELECT 
  'Total Active Promoters' as metric,
  COUNT(DISTINCT p.id)::text as value,
  '' as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'

UNION ALL

SELECT 
  'Promoters with Emails' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = (SELECT COUNT(DISTINCT p2.id) FROM promoters p2 JOIN parties pt2 ON pt2.id = p2.employer_id WHERE p2.status = 'active' AND pt2.type = 'Employer' AND pt2.overall_status = 'active')
    THEN '✅ Complete'
    ELSE '⚠️ Incomplete'
  END as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''

UNION ALL

SELECT 
  'Promoters without Emails' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (p.email IS NULL OR TRIM(p.email) = '')

UNION ALL

SELECT 
  'Promoters with Duplicate Emails' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  )

UNION ALL

SELECT 
  'Promoters with Profiles' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = (SELECT COUNT(DISTINCT p2.id) FROM promoters p2 JOIN parties pt2 ON pt2.id = p2.employer_id WHERE p2.status = 'active' AND pt2.type = 'Employer' AND pt2.overall_status = 'active' AND p2.email IS NOT NULL AND TRIM(p2.email) != '')
    THEN '✅ Complete'
    ELSE '⚠️ Incomplete'
  END as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )

UNION ALL

SELECT 
  'Promoters Needing Registration' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
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

SELECT 
  'Promoters with employer_employee Records' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = (SELECT COUNT(DISTINCT p2.id) FROM promoters p2 JOIN parties pt2 ON pt2.id = p2.employer_id JOIN profiles emp_pr2 ON LOWER(TRIM(emp_pr2.email)) = LOWER(TRIM(pt2.contact_email)) JOIN profiles emp_profile2 ON LOWER(TRIM(emp_profile2.email)) = LOWER(TRIM(p2.email)) WHERE p2.status = 'active' AND pt2.type = 'Employer' AND pt2.overall_status = 'active' AND p2.email IS NOT NULL AND TRIM(p2.email) != '' AND pt2.contact_email IS NOT NULL AND TRIM(pt2.contact_email) != '')
    THEN '✅ Complete'
    ELSE '⚠️ Incomplete'
  END as status
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''

UNION ALL

SELECT 
  'Promoters Missing employer_employee Records' as metric,
  COUNT(DISTINCT p.id)::text as value,
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
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
  )

UNION ALL

SELECT 
  'employer_employees Missing party_id' as metric,
  COUNT(*)::text as value,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
FROM employer_employees
WHERE party_id IS NULL

UNION ALL

SELECT 
  'employer_employees Missing promoter_id' as metric,
  COUNT(*)::text as value,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
FROM employer_employees
WHERE promoter_id IS NULL

UNION ALL

SELECT 
  'employer_employees Missing company_id' as metric,
  COUNT(*)::text as value,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ None'
    ELSE '⚠️ Action Required'
  END as status
FROM employer_employees
WHERE company_id IS NULL
) status_check
ORDER BY 
  CASE 
    WHEN status LIKE '⚠️%' THEN 1
    WHEN status = '✅ Complete' THEN 2
    WHEN status = '✅ None' THEN 3
    ELSE 4
  END,
  metric;

