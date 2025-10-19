-- ============================================================================
-- TEST PROMOTER-EMPLOYER FETCH
-- ============================================================================
-- This script tests if promoters are being fetched with employer_id field
-- ============================================================================

-- 1. Test the exact query used by the usePromoters hook
SELECT 
  '=== PROMOTERS WITH EMPLOYER_ID (usePromoters query) ===' as section,
  id,
  name_en,
  employer_id,
  CASE 
    WHEN employer_id IS NOT NULL THEN '✅ HAS EMPLOYER'
    ELSE '❌ NO EMPLOYER'
  END as status
FROM promoters
ORDER BY first_name
LIMIT 10;

-- 2. Test filtering by specific employer (like the UI does)
SELECT 
  '=== FILTERED BY EMPLOYER (Falcon Eye Business and Promotion) ===' as section,
  p.id,
  p.name_en,
  p.employer_id,
  emp.name_en as employer_name
FROM promoters p
LEFT JOIN parties emp ON emp.id = p.employer_id
WHERE p.employer_id = 'cc3690e4-dd80-4d9e-84db-518a95340826'
ORDER BY p.name_en
LIMIT 5;

-- 3. Check if all promoters have employer_id
SELECT 
  '=== EMPLOYER_ID FIELD STATUS ===' as section,
  COUNT(*) as total_promoters,
  COUNT(employer_id) as promoters_with_employer_id,
  COUNT(*) - COUNT(employer_id) as promoters_without_employer_id,
  ROUND(
    (COUNT(employer_id)::decimal / COUNT(*)) * 100, 2
  ) as percentage_with_employer_id
FROM promoters;

-- 4. Sample of promoters without employer_id (if any)
SELECT 
  '=== PROMOTERS WITHOUT EMPLOYER_ID (if any) ===' as section,
  id,
  name_en,
  employer_id
FROM promoters
WHERE employer_id IS NULL
LIMIT 5;
