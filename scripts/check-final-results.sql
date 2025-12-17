-- ============================================================================
-- FINAL RESULTS CHECK
-- ============================================================================

-- Final counts
SELECT 
  'FINAL COUNTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL) as employer_employees_with_party_id,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as employer_employees_with_promoter_id,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id IS NOT NULL) as employer_employees_with_company_id,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL AND promoter_id IS NOT NULL) as fully_linked;

-- Breakdown of promoters
SELECT 
  'PROMOTERS BREAKDOWN' as check_type,
  'Total promoters with employer' as category,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL

UNION ALL

SELECT 
  'PROMOTERS BREAKDOWN',
  'Promoters that can be linked (both have profiles)',
  COUNT(*)
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
  'PROMOTERS BREAKDOWN',
  'Promoters actually linked',
  COUNT(DISTINCT p.id)
FROM promoters p
INNER JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

-- Show sample of linked promoters
SELECT 
  'SAMPLE LINKED PROMOTERS' as check_type,
  p.id as promoter_id,
  p.email as promoter_email,
  pt.name_en as employer_name,
  ee.id as employer_employee_id,
  ee.party_id,
  ee.promoter_id,
  ee.company_id
FROM promoters p
INNER JOIN employer_employees ee ON ee.promoter_id = p.id
LEFT JOIN parties pt ON pt.id = p.employer_id
LIMIT 10;

