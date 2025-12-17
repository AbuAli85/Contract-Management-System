-- ============================================================================
-- FIND MISSING LINKS - WHY 20 PROMOTERS AREN'T LINKED
-- ============================================================================

-- Check 1: Do these promoters have existing employer_employees records?
SELECT 
  'PROMOTERS WITH EXISTING EMPLOYER_EMPLOYEES' as check_type,
  COUNT(DISTINCT p.id) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL;

-- Check 2: Show sample of promoters that can be linked but have existing records without promoter_id
SELECT 
  'SAMPLE: EXISTING RECORDS WITHOUT PROMOTER_ID' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  emp_profile.id as employee_profile_id,
  emp_pr.id as employer_profile_id,
  ee.id as existing_employer_employee_id,
  ee.employer_id as existing_employer_id,
  ee.employee_id as existing_employee_id,
  ee.promoter_id as existing_promoter_id,
  ee.party_id as existing_party_id,
  CASE 
    WHEN ee.employer_id = emp_pr.id THEN 'MATCH'
    ELSE 'MISMATCH'
  END as employer_match
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL
LIMIT 10;

-- Check 3: Count how many have matching employer_id
SELECT 
  'EXISTING RECORDS WITH MATCHING EMPLOYER' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL;

-- Check 4: Count how many have different employer_id
SELECT 
  'EXISTING RECORDS WITH DIFFERENT EMPLOYER' as check_type,
  COUNT(*) as count
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
INNER JOIN employer_employees ee ON ee.employee_id = emp_profile.id AND ee.employer_id != emp_pr.id
LEFT JOIN employer_employees ee_promoter ON ee_promoter.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee_promoter.id IS NULL;

