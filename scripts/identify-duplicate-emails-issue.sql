-- ============================================================================
-- IDENTIFY DUPLICATE EMAIL ISSUE
-- ============================================================================
-- This script identifies promoters with duplicate emails that will prevent
-- bulk registration (emails must be unique in auth.users and profiles)
-- ============================================================================

-- Count promoters by email (showing duplicates)
SELECT 
  p.email,
  COUNT(DISTINCT p.id) as promoter_count,
  STRING_AGG(DISTINCT p.name_en, ', ' ORDER BY p.name_en) as promoter_names,
  STRING_AGG(DISTINCT pt.name_en, ', ' ORDER BY pt.name_en) as employer_names
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
GROUP BY p.email
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC, p.email;

-- Summary: How many unique emails vs total promoters
SELECT 
  'Total promoters needing registration' as metric,
  COUNT(DISTINCT p.id) as count
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
  'Unique email addresses' as metric,
  COUNT(DISTINCT LOWER(TRIM(p.email))) as count
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
  'Promoters with duplicate emails (cannot register separately)' as metric,
  COUNT(DISTINCT p.id) as count
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
  AND EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  );

