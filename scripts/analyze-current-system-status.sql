-- ============================================================================
-- ANALYZE CURRENT SYSTEM STATUS
-- ============================================================================
-- This script provides a comprehensive analysis of the current system state
-- to identify what's been completed and what still needs to be done
-- ============================================================================

-- ============================================================================
-- PART 1: EMAIL STATUS ANALYSIS
-- ============================================================================

SELECT 
  '=== EMAIL STATUS ANALYSIS ===' as section;

-- Promoters with emails
SELECT 
  'Promoters with emails' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';

-- Promoters without emails
SELECT 
  'Promoters without emails' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (p.email IS NULL OR TRIM(p.email) = '');

-- Promoters with unique emails (no duplicates)
SELECT 
  'Promoters with unique emails' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  );

-- Promoters with duplicate emails
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
  STRING_AGG(DISTINCT p.name_en, ' | ' ORDER BY p.name_en) as promoter_names
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
GROUP BY LOWER(TRIM(p.email))
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC;

-- ============================================================================
-- PART 2: PROFILE REGISTRATION STATUS
-- ============================================================================

SELECT 
  '=== PROFILE REGISTRATION STATUS ===' as section;

-- Promoters with profiles
SELECT 
  'Promoters with profiles' as metric,
  COUNT(DISTINCT p.id) as count
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
  );

-- Promoters needing registration (have email but no profile)
SELECT 
  'Promoters needing registration (have email, no profile)' as metric,
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

-- Promoters needing email assignment (no email)
SELECT 
  'Promoters needing email assignment' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (p.email IS NULL OR TRIM(p.email) = '');

-- ============================================================================
-- PART 3: EMPLOYER_EMPLOYEE RECORD STATUS
-- ============================================================================

SELECT 
  '=== EMPLOYER_EMPLOYEE RECORD STATUS ===' as section;

-- Promoters with employer_employee records
SELECT 
  'Promoters with employer_employee records' as metric,
  COUNT(DISTINCT p.id) as count
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
  AND TRIM(pt.contact_email) != '';

-- Promoters missing employer_employee records (but have both profiles)
SELECT 
  'Promoters missing employer_employee records (have both profiles)' as metric,
  COUNT(DISTINCT p.id) as count
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
-- PART 4: DATA QUALITY CHECK FOR EMPLOYER_EMPLOYEES
-- ============================================================================

SELECT 
  '=== EMPLOYER_EMPLOYEES DATA QUALITY ===' as section;

-- Records missing party_id
SELECT 
  'employer_employees records missing party_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE party_id IS NULL;

-- Records missing promoter_id
SELECT 
  'employer_employees records missing promoter_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE promoter_id IS NULL;

-- Records missing company_id
SELECT 
  'employer_employees records missing company_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE company_id IS NULL;

-- ============================================================================
-- PART 5: COMPREHENSIVE STATUS SUMMARY
-- ============================================================================

SELECT 
  '=== COMPREHENSIVE STATUS SUMMARY ===' as section;

DO $$
DECLARE
  v_total_promoters INTEGER;
  v_promoters_with_email INTEGER;
  v_promoters_without_email INTEGER;
  v_promoters_with_unique_email INTEGER;
  v_promoters_with_duplicate_email INTEGER;
  v_promoters_with_profile INTEGER;
  v_promoters_needing_registration INTEGER;
  v_promoters_with_ee_record INTEGER;
  v_promoters_missing_ee_record INTEGER;
  v_ee_missing_party_id INTEGER;
  v_ee_missing_promoter_id INTEGER;
  v_ee_missing_company_id INTEGER;
BEGIN
  -- Count total active promoters
  SELECT COUNT(DISTINCT p.id) INTO v_total_promoters
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active';

  -- Count promoters with emails
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_email
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND p.email IS NOT NULL
    AND TRIM(p.email) != '';

  -- Count promoters without emails
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_without_email
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND (p.email IS NULL OR TRIM(p.email) = '');

  -- Count promoters with unique emails
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_unique_email
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND p.email IS NOT NULL
    AND TRIM(p.email) != ''
    AND NOT EXISTS (
      SELECT 1 FROM promoters p2
      WHERE p2.id != p.id
        AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
        AND p2.status = 'active'
    );

  -- Count promoters with duplicate emails
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_duplicate_email
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
    );

  -- Count promoters with profiles
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_profile
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
    );

  -- Count promoters needing registration
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_needing_registration
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

  -- Count promoters with employer_employee records
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_ee_record
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
    AND TRIM(pt.contact_email) != '';

  -- Count promoters missing employer_employee records (but have both profiles)
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_missing_ee_record
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

  -- Count employer_employees data quality issues
  SELECT COUNT(*) INTO v_ee_missing_party_id FROM employer_employees WHERE party_id IS NULL;
  SELECT COUNT(*) INTO v_ee_missing_promoter_id FROM employer_employees WHERE promoter_id IS NULL;
  SELECT COUNT(*) INTO v_ee_missing_company_id FROM employer_employees WHERE company_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPREHENSIVE SYSTEM STATUS REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 PROMOTER STATISTICS:';
  RAISE NOTICE '  Total active promoters: %', v_total_promoters;
  RAISE NOTICE '  Promoters with emails: %', v_promoters_with_email;
  RAISE NOTICE '  Promoters without emails: %', v_promoters_without_email;
  RAISE NOTICE '';
  RAISE NOTICE '📧 EMAIL STATUS:';
  RAISE NOTICE '  Promoters with unique emails: %', v_promoters_with_unique_email;
  RAISE NOTICE '  Promoters with duplicate emails: %', v_promoters_with_duplicate_email;
  RAISE NOTICE '';
  RAISE NOTICE '👤 PROFILE STATUS:';
  RAISE NOTICE '  Promoters with profiles: %', v_promoters_with_profile;
  RAISE NOTICE '  Promoters needing registration: %', v_promoters_needing_registration;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 EMPLOYER_EMPLOYEE RECORDS:';
  RAISE NOTICE '  Promoters with employer_employee records: %', v_promoters_with_ee_record;
  RAISE NOTICE '  Promoters missing employer_employee records: %', v_promoters_missing_ee_record;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  DATA QUALITY ISSUES:';
  RAISE NOTICE '  employer_employees missing party_id: %', v_ee_missing_party_id;
  RAISE NOTICE '  employer_employees missing promoter_id: %', v_ee_missing_promoter_id;
  RAISE NOTICE '  employer_employees missing company_id: %', v_ee_missing_company_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Provide recommendations
  IF v_promoters_without_email > 0 THEN
    RAISE WARNING '⚠️  ACTION REQUIRED: % promoters need email assignment', v_promoters_without_email;
    RAISE NOTICE '  Run: scripts/generate-unique-emails-for-promoters.sql';
    RAISE NOTICE '';
  END IF;
  
  IF v_promoters_with_duplicate_email > 0 THEN
    RAISE WARNING '⚠️  ACTION REQUIRED: % promoters have duplicate emails', v_promoters_with_duplicate_email;
    RAISE NOTICE '  Run: scripts/fix-duplicate-emails-and-register.sql';
    RAISE NOTICE '';
  END IF;
  
  IF v_promoters_needing_registration > 0 THEN
    RAISE WARNING '⚠️  ACTION REQUIRED: % promoters need registration', v_promoters_needing_registration;
    RAISE NOTICE '  Use: scripts/check-and-prepare-promoter-registration.sql to prepare data';
    RAISE NOTICE '  Then register via API or Supabase Admin API';
    RAISE NOTICE '';
  END IF;
  
  IF v_promoters_missing_ee_record > 0 THEN
    RAISE WARNING '⚠️  ACTION REQUIRED: % promoters missing employer_employee records', v_promoters_missing_ee_record;
    RAISE NOTICE '  Run: scripts/create-missing-employer-employees-for-existing-profiles.sql';
    RAISE NOTICE '';
  END IF;
  
  IF v_ee_missing_party_id > 0 OR v_ee_missing_promoter_id > 0 OR v_ee_missing_company_id > 0 THEN
    RAISE WARNING '⚠️  ACTION REQUIRED: Data quality issues in employer_employees';
    RAISE NOTICE '  Run: scripts/fix-employer-employees-data-quality.sql';
    RAISE NOTICE '';
  END IF;
  
  IF v_promoters_without_email = 0 
     AND v_promoters_with_duplicate_email = 0 
     AND v_promoters_needing_registration = 0 
     AND v_promoters_missing_ee_record = 0 
     AND v_ee_missing_party_id = 0 
     AND v_ee_missing_promoter_id = 0 
     AND v_ee_missing_company_id = 0 THEN
    RAISE NOTICE '✅ ALL SYSTEMS GO! All promoters are properly set up.';
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

