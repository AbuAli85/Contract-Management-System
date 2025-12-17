-- ============================================================================
-- DEEP DIAGNOSTIC - WHY 20 PROMOTERS AREN'T LINKING
-- ============================================================================

-- Check 1: Show all 24 promoters that CAN be linked
SELECT 
  'ALL LINKABLE PROMOTERS' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  pt.contact_email as employer_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id,
  CASE WHEN ee.id IS NOT NULL THEN 'LINKED' ELSE 'NOT LINKED' END as status,
  ee.id as employer_employee_id,
  ee.promoter_id as ee_promoter_id,
  ee.employer_id as ee_employer_id,
  ee.employee_id as ee_employee_id
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON (
  ee.promoter_id = p.id 
  OR (ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id)
)
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
ORDER BY CASE WHEN ee.id IS NOT NULL THEN 0 ELSE 1 END, p.email;

-- Check 2: For NOT LINKED promoters, check if they have ANY employer_employees record
SELECT 
  'NOT LINKED - CHECKING EXISTING RECORDS' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id,
  COUNT(ee.id) as existing_ee_records,
  STRING_AGG(ee.id::text, ', ') as ee_ids,
  STRING_AGG(CASE WHEN ee.employer_id = emp_pr.id THEN 'MATCH' ELSE 'MISMATCH' END, ', ') as employer_match
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = emp_profile.id
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL
GROUP BY p.id, p.email, emp_profile.id, emp_pr.id
ORDER BY existing_ee_records DESC;

-- Check 3: Check if the INSERT is being blocked by unique constraint
SELECT 
  'POTENTIAL CONSTRAINT ISSUES' as check_type,
  p.id as promoter_id,
  emp_profile.id as employee_id,
  emp_pr.id as employer_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM employer_employees ee 
      WHERE ee.employee_id = emp_profile.id 
        AND ee.employer_id = emp_pr.id
    ) THEN 'RECORD EXISTS'
    ELSE 'NO RECORD'
  END as constraint_check
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
LIMIT 20;

