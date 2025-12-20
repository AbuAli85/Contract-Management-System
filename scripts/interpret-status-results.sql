-- ============================================================================
-- INTERPRET STATUS RESULTS AND PROVIDE ACTION PLAN
-- ============================================================================
-- This script provides a clear interpretation of the system status
-- and generates a prioritized action plan
-- ============================================================================

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
  v_duplicate_email_groups INTEGER;
  v_completion_percentage NUMERIC;
BEGIN
  -- Gather all statistics
  SELECT COUNT(DISTINCT p.id) INTO v_total_promoters
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active';

  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_email
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND p.email IS NOT NULL
    AND TRIM(p.email) != '';

  SELECT COUNT(DISTINCT p.id) INTO v_promoters_without_email
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND (p.email IS NULL OR TRIM(p.email) = '');

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

  SELECT COUNT(*) INTO v_ee_missing_party_id FROM employer_employees WHERE party_id IS NULL;
  SELECT COUNT(*) INTO v_ee_missing_promoter_id FROM employer_employees WHERE promoter_id IS NULL;
  SELECT COUNT(*) INTO v_ee_missing_company_id FROM employer_employees WHERE company_id IS NULL;

  SELECT COUNT(*) INTO v_duplicate_email_groups
  FROM (
    SELECT LOWER(TRIM(p.email)) as email
    FROM promoters p
    JOIN parties pt ON pt.id = p.employer_id
    WHERE p.status = 'active'
      AND pt.type = 'Employer'
      AND pt.overall_status = 'active'
      AND p.email IS NOT NULL
      AND TRIM(p.email) != ''
    GROUP BY LOWER(TRIM(p.email))
    HAVING COUNT(DISTINCT p.id) > 1
  ) duplicates;

  -- Calculate completion percentage
  IF v_total_promoters > 0 THEN
    v_completion_percentage := (
      (v_promoters_with_ee_record::NUMERIC / v_total_promoters::NUMERIC) * 100
    );
  ELSE
    v_completion_percentage := 0;
  END IF;

  -- Print formatted report
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║          SYSTEM STATUS INTERPRETATION & ACTION PLAN          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 OVERALL PROGRESS:';
  RAISE NOTICE '   Total Active Promoters: %', v_total_promoters;
  RAISE NOTICE '   Completion: %%%', ROUND(v_completion_percentage, 1);
  RAISE NOTICE '   Promoters Fully Set Up: % / %', v_promoters_with_ee_record, v_total_promoters;
  RAISE NOTICE '';

  -- Email Status
  RAISE NOTICE '📧 EMAIL STATUS:';
  IF v_promoters_without_email > 0 THEN
    RAISE WARNING '   ⚠️  % promoters need email assignment', v_promoters_without_email;
  ELSE
    RAISE NOTICE '   ✅ All promoters have emails';
  END IF;

  IF v_promoters_with_duplicate_email > 0 THEN
    RAISE WARNING '   ⚠️  % promoters have duplicate emails (% duplicate groups)', 
      v_promoters_with_duplicate_email, v_duplicate_email_groups;
  ELSE
    RAISE NOTICE '   ✅ All emails are unique';
  END IF;
  RAISE NOTICE '';

  -- Profile Status
  RAISE NOTICE '👤 PROFILE STATUS:';
  IF v_promoters_needing_registration > 0 THEN
    RAISE WARNING '   ⚠️  % promoters need registration', v_promoters_needing_registration;
  ELSE
    RAISE NOTICE '   ✅ All promoters have profiles';
  END IF;
  RAISE NOTICE '   Promoters with profiles: %', v_promoters_with_profile;
  RAISE NOTICE '';

  -- Employer_Employee Records
  RAISE NOTICE '🔗 EMPLOYER_EMPLOYEE RECORDS:';
  IF v_promoters_missing_ee_record > 0 THEN
    RAISE WARNING '   ⚠️  % promoters missing employer_employee records', v_promoters_missing_ee_record;
  ELSE
    RAISE NOTICE '   ✅ All promoters have employer_employee records';
  END IF;
  RAISE NOTICE '   Promoters with records: %', v_promoters_with_ee_record;
  RAISE NOTICE '';

  -- Data Quality
  RAISE NOTICE '⚠️  DATA QUALITY:';
  IF v_ee_missing_party_id > 0 OR v_ee_missing_promoter_id > 0 OR v_ee_missing_company_id > 0 THEN
    IF v_ee_missing_party_id > 0 THEN
      RAISE WARNING '   ⚠️  % employer_employees missing party_id', v_ee_missing_party_id;
    END IF;
    IF v_ee_missing_promoter_id > 0 THEN
      RAISE WARNING '   ⚠️  % employer_employees missing promoter_id', v_ee_missing_promoter_id;
    END IF;
    IF v_ee_missing_company_id > 0 THEN
      RAISE WARNING '   ⚠️  % employer_employees missing company_id', v_ee_missing_company_id;
    END IF;
  ELSE
    RAISE NOTICE '   ✅ No data quality issues detected';
  END IF;
  RAISE NOTICE '';

  -- Action Plan
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    PRIORITIZED ACTION PLAN                    ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- Priority 1: Email Assignment
  IF v_promoters_without_email > 0 THEN
    RAISE NOTICE '🔴 PRIORITY 1: Assign Emails to Promoters';
    RAISE NOTICE '   Action: Run scripts/assign-emails-to-promoters-without-emails.sql';
    RAISE NOTICE '   Affects: % promoters', v_promoters_without_email;
    RAISE NOTICE '';
  END IF;

  -- Priority 2: Fix Duplicate Emails
  IF v_promoters_with_duplicate_email > 0 THEN
    RAISE NOTICE '🔴 PRIORITY 2: Fix Duplicate Emails';
    RAISE NOTICE '   Action: Run scripts/fix-duplicate-emails-and-register.sql';
    RAISE NOTICE '   Affects: % promoters (% duplicate groups)', 
      v_promoters_with_duplicate_email, v_duplicate_email_groups;
    RAISE NOTICE '';
  END IF;

  -- Priority 3: Register Promoters
  IF v_promoters_needing_registration > 0 THEN
    RAISE NOTICE '🟡 PRIORITY 3: Register Promoters';
    RAISE NOTICE '   Step 1: Prepare data: scripts/check-and-prepare-promoter-registration.sql';
    RAISE NOTICE '   Step 2: Register via API or Supabase Admin API';
    RAISE NOTICE '   Affects: % promoters', v_promoters_needing_registration;
    RAISE NOTICE '';
  END IF;

  -- Priority 4: Create Employer_Employee Records
  IF v_promoters_missing_ee_record > 0 THEN
    RAISE NOTICE '🟡 PRIORITY 4: Create Employer_Employee Records';
    RAISE NOTICE '   Action: Run scripts/create-missing-employer-employees-for-existing-profiles.sql';
    RAISE NOTICE '   Affects: % promoters', v_promoters_missing_ee_record;
    RAISE NOTICE '   Note: Requires promoters to have profiles first';
    RAISE NOTICE '';
  END IF;

  -- Priority 5: Fix Data Quality
  IF v_ee_missing_party_id > 0 OR v_ee_missing_promoter_id > 0 OR v_ee_missing_company_id > 0 THEN
    RAISE NOTICE '🟢 PRIORITY 5: Fix Data Quality Issues';
    RAISE NOTICE '   Action: Run scripts/fix-employer-employees-data-quality.sql';
    RAISE NOTICE '   Affects: % records', 
      COALESCE(v_ee_missing_party_id, 0) + COALESCE(v_ee_missing_promoter_id, 0) + COALESCE(v_ee_missing_company_id, 0);
    RAISE NOTICE '';
  END IF;

  -- Success Message
  IF v_promoters_without_email = 0 
     AND v_promoters_with_duplicate_email = 0 
     AND v_promoters_needing_registration = 0 
     AND v_promoters_missing_ee_record = 0 
     AND v_ee_missing_party_id = 0 
     AND v_ee_missing_promoter_id = 0 
     AND v_ee_missing_company_id = 0 THEN
    RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                    ✅ ALL SYSTEMS GO! ✅                      ║';
    RAISE NOTICE '║         All promoters are properly set up and ready!        ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

