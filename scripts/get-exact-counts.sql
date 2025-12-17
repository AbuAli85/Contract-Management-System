-- ============================================================================
-- EXACT COUNTS - FINAL VERIFICATION
-- ============================================================================

SELECT 
  'EXACT COUNTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL) as employer_employees_with_party_id,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as employer_employees_with_promoter_id,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id IS NOT NULL) as employer_employees_with_company_id,
  (SELECT COUNT(*) FROM employer_employees WHERE party_id IS NOT NULL AND promoter_id IS NOT NULL) as fully_linked;

-- Count promoters that can be linked vs actually linked
SELECT 
  'PROMOTERS COMPARISON' as check_type,
  (SELECT COUNT(*) 
   FROM promoters p
   INNER JOIN parties pt ON pt.id = p.employer_id
   INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
   INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
   WHERE p.employer_id IS NOT NULL
     AND p.email IS NOT NULL
     AND TRIM(p.email) != ''
     AND pt.contact_email IS NOT NULL
     AND TRIM(pt.contact_email) != '') as can_be_linked,
  (SELECT COUNT(DISTINCT p.id)
   FROM promoters p
   INNER JOIN employer_employees ee ON ee.promoter_id = p.id
   WHERE p.employer_id IS NOT NULL) as actually_linked;

