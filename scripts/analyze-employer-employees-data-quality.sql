-- ============================================================================
-- ANALYZE EMPLOYER_EMPLOYEES DATA QUALITY
-- ============================================================================
-- This script analyzes employer_employees records to identify:
-- 1. Records missing party_id
-- 2. Records missing promoter_id
-- 3. Records with self-references (employee_id = employer_id)
-- 4. Records with missing company_id
-- 5. Overall data quality issues
-- ============================================================================

-- ============================================================================
-- PART 1: SUMMARY STATISTICS
-- ============================================================================

SELECT 
  '=== EMPLOYER_EMPLOYEES SUMMARY ===' as section;

SELECT 
  'Total employer_employee records' as metric,
  COUNT(*) as count
FROM employer_employees

UNION ALL

SELECT 
  'Records with party_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE party_id IS NOT NULL

UNION ALL

SELECT 
  'Records missing party_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE party_id IS NULL

UNION ALL

SELECT 
  'Records with promoter_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE promoter_id IS NOT NULL

UNION ALL

SELECT 
  'Records missing promoter_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE promoter_id IS NULL

UNION ALL

SELECT 
  'Records with company_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE company_id IS NOT NULL

UNION ALL

SELECT 
  'Records missing company_id' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE company_id IS NULL

UNION ALL

SELECT 
  'Records with self-reference (employee_id = employer_id)' as metric,
  COUNT(*) as count
FROM employer_employees
WHERE employee_id = employer_id;

-- ============================================================================
-- PART 2: RECORDS MISSING party_id
-- ============================================================================

SELECT 
  '=== RECORDS MISSING party_id ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.company_id,
  ee.party_id,
  emp_pr.email as employer_email,
  emp_pr.full_name as employer_name,
  emp_profile.email as employee_email,
  emp_profile.full_name as employee_name,
  p.name_en as promoter_name,
  p.employer_id as promoter_employer_id,
  pt.name_en as party_name,
  CASE 
    WHEN p.employer_id IS NOT NULL THEN 'Can be fixed: promoter has employer_id'
    ELSE 'Cannot auto-fix: promoter missing employer_id'
  END as fix_status
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
LEFT JOIN promoters p ON p.id = ee.promoter_id
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE ee.party_id IS NULL
ORDER BY ee.created_at DESC;

-- ============================================================================
-- PART 3: RECORDS MISSING promoter_id
-- ============================================================================

SELECT 
  '=== RECORDS MISSING promoter_id ===' as section;

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
  p.id as potential_promoter_id,
  p.name_en as potential_promoter_name,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Can be fixed: promoter found by email'
    ELSE 'No matching promoter found'
  END as fix_status
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
LEFT JOIN promoters p ON LOWER(TRIM(p.email)) = LOWER(TRIM(emp_profile.email))
  AND p.status = 'active'
WHERE ee.promoter_id IS NULL
ORDER BY ee.created_at DESC;

-- ============================================================================
-- PART 4: RECORDS WITH SELF-REFERENCE (employee_id = employer_id)
-- ============================================================================

SELECT 
  '=== RECORDS WITH SELF-REFERENCE ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  ee.company_id,
  emp_pr.email as email,
  emp_pr.full_name as name,
  emp_pr.role as role,
  CASE 
    WHEN emp_pr.role = 'manager' THEN 'Likely employer managing themselves (may be intentional)'
    WHEN emp_pr.role = 'promoter' THEN '⚠️ Promoter should not be their own employer'
    ELSE 'Review needed'
  END as issue_type
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
WHERE ee.employee_id = ee.employer_id
ORDER BY ee.created_at DESC;

-- ============================================================================
-- PART 5: RECORDS MISSING company_id
-- ============================================================================

SELECT 
  '=== RECORDS MISSING company_id ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  ee.company_id,
  emp_pr.email as employer_email,
  emp_profile.email as employee_email,
  pt.name_en as party_name,
  c.id as potential_company_id,
  c.name as potential_company_name,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Can be fixed: company found by party_id'
    WHEN pt.id IS NOT NULL THEN 'Can be fixed: find company by party_id'
    ELSE 'Cannot auto-fix: missing party_id'
  END as fix_status
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
LEFT JOIN parties pt ON pt.id = ee.party_id
LEFT JOIN companies c ON c.party_id = ee.party_id OR c.id = ee.party_id
WHERE ee.company_id IS NULL
ORDER BY ee.created_at DESC;

-- ============================================================================
-- PART 6: COMPREHENSIVE DATA QUALITY REPORT
-- ============================================================================

SELECT 
  '=== COMPREHENSIVE DATA QUALITY REPORT ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  ee.company_id,
  emp_pr.email as employer_email,
  emp_profile.email as employee_email,
  p.name_en as promoter_name,
  pt.name_en as party_name,
  c.name as company_name,
  CASE 
    WHEN ee.party_id IS NULL THEN 'Missing party_id'
    WHEN ee.promoter_id IS NULL THEN 'Missing promoter_id'
    WHEN ee.company_id IS NULL THEN 'Missing company_id'
    WHEN ee.employee_id = ee.employer_id THEN 'Self-reference'
    ELSE '✅ Complete'
  END as data_quality_status,
  CASE 
    WHEN ee.party_id IS NULL AND p.employer_id IS NOT NULL THEN 'Can fix: Set party_id from promoter'
    WHEN ee.promoter_id IS NULL AND p.id IS NOT NULL THEN 'Can fix: Set promoter_id from email match'
    WHEN ee.company_id IS NULL AND c.id IS NOT NULL THEN 'Can fix: Set company_id from party_id'
    WHEN ee.employee_id = ee.employer_id THEN 'Review: Self-reference may be intentional'
    ELSE 'No action needed'
  END as fix_action
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
LEFT JOIN promoters p ON p.id = ee.promoter_id
  OR (ee.promoter_id IS NULL AND LOWER(TRIM(p.email)) = LOWER(TRIM(emp_profile.email)) AND p.status = 'active')
LEFT JOIN parties pt ON pt.id = ee.party_id OR pt.id = p.employer_id
LEFT JOIN companies c ON c.party_id = ee.party_id OR c.id = ee.party_id OR c.party_id = p.employer_id
WHERE 
  ee.party_id IS NULL 
  OR ee.promoter_id IS NULL 
  OR ee.company_id IS NULL
  OR ee.employee_id = ee.employer_id
ORDER BY 
  CASE 
    WHEN ee.party_id IS NULL THEN 1
    WHEN ee.promoter_id IS NULL THEN 2
    WHEN ee.company_id IS NULL THEN 3
    WHEN ee.employee_id = ee.employer_id THEN 4
    ELSE 5
  END,
  ee.created_at DESC;

-- ============================================================================
-- PART 7: FIX RECOMMENDATIONS
-- ============================================================================

SELECT 
  '=== FIX RECOMMENDATIONS ===' as section;

DO $$
DECLARE
  v_missing_party_id INTEGER;
  v_missing_promoter_id INTEGER;
  v_missing_company_id INTEGER;
  v_self_references INTEGER;
BEGIN
  -- Count issues
  SELECT COUNT(*) INTO v_missing_party_id
  FROM employer_employees
  WHERE party_id IS NULL;
  
  SELECT COUNT(*) INTO v_missing_promoter_id
  FROM employer_employees
  WHERE promoter_id IS NULL;
  
  SELECT COUNT(*) INTO v_missing_company_id
  FROM employer_employees
  WHERE company_id IS NULL;
  
  SELECT COUNT(*) INTO v_self_references
  FROM employer_employees
  WHERE employee_id = employer_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA QUALITY SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Records missing party_id: %', v_missing_party_id;
  RAISE NOTICE 'Records missing promoter_id: %', v_missing_promoter_id;
  RAISE NOTICE 'Records missing company_id: %', v_missing_company_id;
  RAISE NOTICE 'Records with self-reference: %', v_self_references;
  RAISE NOTICE '';
  
  IF v_missing_party_id > 0 OR v_missing_promoter_id > 0 OR v_missing_company_id > 0 OR v_self_references > 0 THEN
    RAISE WARNING '⚠️  DATA QUALITY ISSUES DETECTED!';
    RAISE NOTICE '';
    RAISE NOTICE 'Recommended fixes:';
    
    IF v_missing_party_id > 0 THEN
      RAISE NOTICE '  - Fix missing party_id: Update from promoter.employer_id';
    END IF;
    
    IF v_missing_promoter_id > 0 THEN
      RAISE NOTICE '  - Fix missing promoter_id: Match by employee email';
    END IF;
    
    IF v_missing_company_id > 0 THEN
      RAISE NOTICE '  - Fix missing company_id: Link from party_id';
    END IF;
    
    IF v_self_references > 0 THEN
      RAISE NOTICE '  - Review self-references: May be intentional for employers';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Run: scripts/fix-employer-employees-data-quality.sql';
  ELSE
    RAISE NOTICE '✅ All records have complete data!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

