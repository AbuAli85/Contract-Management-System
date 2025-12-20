-- ============================================================================
-- FIX EMPLOYER_EMPLOYEES DATA QUALITY ISSUES
-- ============================================================================
-- This script fixes common data quality issues in employer_employees:
-- 1. Missing party_id (set from promoter.employer_id)
-- 2. Missing promoter_id (match by employee email)
-- 3. Missing company_id (link from party_id)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX MISSING party_id
-- ============================================================================

-- Method 1: Update party_id from promoter.employer_id where promoter_id exists
UPDATE employer_employees ee
SET 
  party_id = p.employer_id,
  updated_at = NOW()
FROM promoters p
WHERE ee.promoter_id = p.id
  AND ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed missing party_id from promoter.employer_id: % records', v_fixed;
END $$;

-- Method 2: Update party_id from employer profile email (when promoter missing employer_id)
-- Find party by matching employer profile email to parties.contact_email
UPDATE employer_employees ee
SET 
  party_id = pt.id,
  updated_at = NOW()
FROM profiles emp_pr
JOIN parties pt ON LOWER(TRIM(pt.contact_email)) = LOWER(TRIM(emp_pr.email))
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
WHERE ee.employer_id = emp_pr.id
  AND ee.party_id IS NULL
  AND pt.id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed missing party_id from employer profile email: % records', v_fixed;
END $$;

-- ============================================================================
-- PART 2: FIX MISSING promoter_id
-- ============================================================================

-- Update promoter_id by matching employee email to promoter email
UPDATE employer_employees ee
SET 
  promoter_id = p.id,
  updated_at = NOW()
FROM profiles emp_profile
JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(emp_profile.email))
  AND p.status = 'active'
WHERE ee.employee_id = emp_profile.id
  AND ee.promoter_id IS NULL
  AND p.id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed missing promoter_id: % records', v_fixed;
END $$;

-- ============================================================================
-- PART 3: FIX MISSING company_id
-- ============================================================================

-- Update company_id from party_id where party_id exists
UPDATE employer_employees ee
SET 
  company_id = c.id,
  updated_at = NOW()
FROM companies c
WHERE (c.party_id = ee.party_id OR c.id = ee.party_id)
  AND ee.company_id IS NULL
  AND ee.party_id IS NOT NULL
  AND c.id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed missing company_id: % records', v_fixed;
END $$;

-- ============================================================================
-- PART 4: FIX PROMOTER'S MISSING employer_id (if possible)
-- ============================================================================

-- Update promoter.employer_id from employer_employees.employer_id via party
-- This fixes promoters that are missing employer_id
UPDATE promoters p
SET 
  employer_id = pt.id,
  updated_at = NOW()
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN parties pt ON LOWER(TRIM(pt.contact_email)) = LOWER(TRIM(emp_pr.email))
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
WHERE p.id = ee.promoter_id
  AND p.employer_id IS NULL
  AND pt.id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed promoter.employer_id: % records', v_fixed;
END $$;

-- ============================================================================
-- PART 5: FIX party_id FROM PROMOTER (retry after fixing promoter)
-- ============================================================================

-- If party_id is still missing but promoter_id exists, get it from promoter
-- (This will work now if we just fixed the promoter's employer_id)
UPDATE employer_employees ee
SET 
  party_id = p.employer_id,
  updated_at = NOW()
FROM promoters p
WHERE ee.promoter_id = p.id
  AND ee.party_id IS NULL
  AND p.employer_id IS NOT NULL;

-- Report results
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed party_id from promoter (after fixing promoter): % records', v_fixed;
END $$;

-- ============================================================================
-- PART 5: FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_missing_party_id INTEGER;
  v_missing_promoter_id INTEGER;
  v_missing_company_id INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM employer_employees;
  
  SELECT COUNT(*) INTO v_missing_party_id
  FROM employer_employees
  WHERE party_id IS NULL;
  
  SELECT COUNT(*) INTO v_missing_promoter_id
  FROM employer_employees
  WHERE promoter_id IS NULL;
  
  SELECT COUNT(*) INTO v_missing_company_id
  FROM employer_employees
  WHERE company_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA QUALITY FIX RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total records: %', v_total;
  RAISE NOTICE 'Records missing party_id: %', v_missing_party_id;
  RAISE NOTICE 'Records missing promoter_id: %', v_missing_promoter_id;
  RAISE NOTICE 'Records missing company_id: %', v_missing_company_id;
  RAISE NOTICE '';
  
  IF v_missing_party_id = 0 AND v_missing_promoter_id = 0 AND v_missing_company_id = 0 THEN
    RAISE NOTICE '✅ All records have complete data!';
  ELSE
    RAISE WARNING '⚠️  Some records still have missing data.';
    RAISE NOTICE 'Review the records above for manual fixes.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 6: SHOW REMAINING ISSUES (if any)
-- ============================================================================

-- Show records that still have issues (for manual review)
SELECT 
  '=== REMAINING ISSUES (Manual Review Needed) ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  ee.company_id,
  emp_pr.email as employer_email,
  emp_profile.email as employee_email,
  emp_profile.full_name as employee_name,
  p.name_en as promoter_name,
  pt.name_en as party_name,
  c.name as company_name,
  CASE 
    WHEN ee.party_id IS NULL THEN 'Missing party_id'
    WHEN ee.promoter_id IS NULL THEN 'Missing promoter_id'
    WHEN ee.company_id IS NULL THEN 'Missing company_id'
    ELSE 'Other issue'
  END as issue_type
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
LEFT JOIN promoters p ON p.id = ee.promoter_id
LEFT JOIN parties pt ON pt.id = ee.party_id
LEFT JOIN companies c ON c.id = ee.company_id
WHERE 
  ee.party_id IS NULL 
  OR ee.promoter_id IS NULL 
  OR ee.company_id IS NULL
ORDER BY 
  CASE 
    WHEN ee.party_id IS NULL THEN 1
    WHEN ee.promoter_id IS NULL THEN 2
    WHEN ee.company_id IS NULL THEN 3
    ELSE 4
  END,
  ee.created_at DESC;

