-- ============================================================================
-- CHECK AND PREPARE PROMOTER REGISTRATION
-- ============================================================================
-- This script:
-- 1. Checks for duplicate emails (blocker for registration)
-- 2. Shows summary of promoters needing registration
-- 3. Prepares data for bulk registration
-- ============================================================================

-- ============================================================================
-- PART 1: CHECK FOR DUPLICATE EMAILS
-- ============================================================================

SELECT 
  '=== DUPLICATE EMAIL CHECK ===' as section;

-- Count promoters with duplicate emails
SELECT 
  'Promoters with duplicate emails' as metric,
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

-- Show duplicate email groups
SELECT 
  LOWER(TRIM(p.email)) as email,
  COUNT(DISTINCT p.id) as promoter_count,
  STRING_AGG(DISTINCT p.name_en, ' | ' ORDER BY p.name_en) as promoter_names,
  STRING_AGG(DISTINCT pt.name_en, ' | ' ORDER BY pt.name_en) as employer_names
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
GROUP BY LOWER(TRIM(p.email))
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC, LOWER(TRIM(p.email))
LIMIT 20;

-- ============================================================================
-- PART 2: SUMMARY OF PROMOTERS NEEDING REGISTRATION
-- ============================================================================

SELECT 
  '=== PROMOTERS NEEDING REGISTRATION ===' as section;

-- Total count
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
  );

-- Count by employer
SELECT 
  pt.name_en as employer_name,
  COUNT(DISTINCT p.id) as promoters_to_register,
  COUNT(DISTINCT LOWER(TRIM(p.email))) as unique_emails,
  CASE 
    WHEN COUNT(DISTINCT p.id) > COUNT(DISTINCT LOWER(TRIM(p.email))) 
    THEN '⚠️ Has duplicate emails'
    ELSE '✅ All emails unique'
  END as email_status
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
ORDER BY COUNT(DISTINCT p.id) DESC, pt.name_en;

-- ============================================================================
-- PART 3: PREPARE DATA FOR BULK REGISTRATION
-- ============================================================================

SELECT 
  '=== DATA FOR BULK REGISTRATION ===' as section;

-- CSV-ready format
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
-- PART 4: JSON FORMAT FOR API (First 10 as sample)
-- ============================================================================

SELECT 
  '=== JSON FORMAT (Sample - First 10) ===' as section;

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
FROM (
  SELECT DISTINCT
    p.id,
    p.email,
    p.name_en,
    p.name_ar,
    p.mobile_number,
    p.phone,
    pt.id as party_id,
    pt.name_en as party_name
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
  ORDER BY pt.name_en, p.name_en
  LIMIT 10
) p
JOIN parties pt ON pt.id = p.party_id;

-- ============================================================================
-- PART 5: RECOMMENDATIONS
-- ============================================================================

SELECT 
  '=== RECOMMENDATIONS ===' as section;

-- Check if duplicates exist
DO $$
DECLARE
  v_duplicate_count INTEGER;
  v_total_count INTEGER;
  v_unique_count INTEGER;
BEGIN
  -- Count total promoters needing registration
  SELECT COUNT(DISTINCT p.id) INTO v_total_count
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
    );
  
  -- Count unique emails
  SELECT COUNT(DISTINCT LOWER(TRIM(p.email))) INTO v_unique_count
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
    );
  
  -- Count promoters with duplicates
  SELECT COUNT(DISTINCT p.id) INTO v_duplicate_count
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
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REGISTRATION READINESS CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total promoters needing registration: %', v_total_count;
  RAISE NOTICE 'Unique email addresses: %', v_unique_count;
  RAISE NOTICE 'Promoters with duplicate emails: %', v_duplicate_count;
  RAISE NOTICE '';
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING '⚠️  DUPLICATE EMAILS DETECTED!';
    RAISE WARNING 'You must fix duplicate emails before registration.';
    RAISE WARNING 'Run: scripts/fix-duplicate-emails-and-register.sql';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ All emails are unique! Ready for registration.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Use the CSV/JSON data above for bulk registration';
    RAISE NOTICE '2. Use API endpoint: POST /api/employer/team/invite';
    RAISE NOTICE '3. Or use Supabase Admin API to create auth.users';
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

