-- ============================================================================
-- PREPARE ALL PROMOTERS FOR REGISTRATION
-- ============================================================================
-- This script prepares registration data for all 169 promoters needing registration
-- Output formats: CSV-ready, JSON for API, and summary statistics
-- ============================================================================

-- ============================================================================
-- PART 1: SUMMARY
-- ============================================================================

SELECT 
  '=== REGISTRATION SUMMARY ===' as section;

SELECT 
  'Total promoters needing registration' as metric,
  COUNT(DISTINCT p.id)::text as value
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
  );

-- Count by employer
SELECT 
  pt.name_en as employer_name,
  COUNT(DISTINCT p.id) as promoters_to_register
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
GROUP BY pt.id, pt.name_en
ORDER BY COUNT(DISTINCT p.id) DESC, pt.name_en;

-- ============================================================================
-- PART 2: CSV-READY FORMAT (All 169 promoters)
-- ============================================================================

SELECT 
  '=== CSV-READY FORMAT (All Promoters) ===' as section;

SELECT 
  p.id as promoter_id,
  COALESCE(p.name_en, p.name_ar, 'Employee') as full_name,
  p.email,
  COALESCE(p.mobile_number, p.phone, '') as phone,
  pt.name_en as employer_name,
  pt.id as employer_party_id,
  pt.contact_email as employer_email,
  p.status as promoter_status
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
ORDER BY pt.name_en, p.name_en;

-- ============================================================================
-- PART 3: JSON FORMAT FOR API (All promoters in one array)
-- ============================================================================

SELECT 
  '=== JSON FORMAT FOR API (All 169 Promoters) ===' as section;

SELECT 
  json_agg(
    json_build_object(
      'email', p.email,
      'full_name', COALESCE(p.name_en, p.name_ar, 'Employee'),
      'phone', COALESCE(p.mobile_number, p.phone, null),
      'role', 'promoter',
      'status', 'approved',
      'promoter_id', p.id::text,
      'employer_party_id', pt.id::text,
      'employer_name', pt.name_en
    )
    ORDER BY pt.name_en, p.name_en
  ) as registration_data
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
  );

-- ============================================================================
-- PART 4: JSON FORMAT GROUPED BY EMPLOYER (For batch processing)
-- ============================================================================

SELECT 
  '=== JSON FORMAT GROUPED BY EMPLOYER ===' as section;

SELECT 
  pt.id as employer_party_id,
  pt.name_en as employer_name,
  pt.contact_email as employer_email,
  COUNT(DISTINCT p.id) as promoter_count,
  json_agg(
    json_build_object(
      'email', p.email,
      'full_name', COALESCE(p.name_en, p.name_ar, 'Employee'),
      'phone', COALESCE(p.mobile_number, p.phone, null),
      'role', 'promoter',
      'status', 'approved',
      'promoter_id', p.id::text
    )
    ORDER BY p.name_en
  ) as promoters
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
GROUP BY pt.id, pt.name_en, pt.contact_email
ORDER BY COUNT(DISTINCT p.id) DESC, pt.name_en;

-- ============================================================================
-- PART 5: VERIFICATION QUERIES (After Registration)
-- ============================================================================

SELECT 
  '=== VERIFICATION QUERIES (Run After Registration) ===' as section;

-- Query to check registration progress
SELECT 
  'Check registration progress' as query_name,
  'SELECT COUNT(DISTINCT p.id) as registered_count FROM promoters p JOIN parties pt ON pt.id = p.employer_id JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email)) WHERE pt.type = ''Employer'' AND pt.overall_status = ''active'' AND p.status = ''active'' AND p.email IS NOT NULL AND TRIM(p.email) != ''''' as query;

-- Query to create employer_employee records after registration
SELECT 
  'Create employer_employee records' as query_name,
  'Run: scripts/create-missing-employer-employees-for-existing-profiles.sql' as query;

