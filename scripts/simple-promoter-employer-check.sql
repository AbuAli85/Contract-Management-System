-- ============================================================================
-- SIMPLE PROMOTER-EMPLOYER MAPPING CHECK
-- ============================================================================
-- This script safely checks promoter-employer relationships without type conflicts
-- ============================================================================

-- 1. Check if employer_id column exists
SELECT 
  '=== EMPLOYER_ID COLUMN CHECK ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'employer_id'
    ) THEN '✅ employer_id column EXISTS'
    ELSE '❌ employer_id column MISSING'
  END as status;

-- 2. Count promoters with and without employer assignments
SELECT 
  '=== PROMOTER EMPLOYER ASSIGNMENT SUMMARY ===' as section,
  COUNT(*) as total_promoters,
  COUNT(employer_id) as promoters_with_employer,
  COUNT(*) - COUNT(employer_id) as promoters_without_employer,
  ROUND(
    (COUNT(employer_id)::decimal / COUNT(*)) * 100, 2
  ) as percentage_assigned
FROM promoters;

-- 3. List all employers and their promoter counts
SELECT 
  '=== EMPLOYERS AND THEIR PROMOTER COUNTS ===' as section,
  p.id as employer_id,
  p.name_en as employer_name,
  p.type as employer_type,
  COUNT(pr.id) as promoter_count
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en, p.type
ORDER BY promoter_count DESC, p.name_en;

-- 4. Promoters without employer assignment (first 10)
SELECT 
  '=== PROMOTERS WITHOUT EMPLOYER (SAMPLE) ===' as section,
  pr.id,
  pr.name_en,
  pr.name_ar,
  pr.id_card_number,
  pr.status,
  pr.created_at
FROM promoters pr
WHERE pr.employer_id IS NULL
ORDER BY pr.created_at DESC
LIMIT 10;

-- 5. Sample promoter data with employer information (first 10)
SELECT 
  '=== SAMPLE PROMOTER-EMPLOYER DATA ===' as section,
  pr.id as promoter_id,
  pr.name_en as promoter_name,
  pr.employer_id,
  p.name_en as employer_name,
  p.type as employer_type
FROM promoters pr
LEFT JOIN parties p ON p.id = pr.employer_id
ORDER BY pr.created_at DESC
LIMIT 10;

-- 6. Check for orphaned employer_id references
SELECT 
  '=== ORPHANED EMPLOYER REFERENCES ===' as section,
  pr.id as promoter_id,
  pr.name_en as promoter_name,
  pr.employer_id as orphaned_employer_id
FROM promoters pr
LEFT JOIN parties p ON p.id = pr.employer_id
WHERE pr.employer_id IS NOT NULL 
AND p.id IS NULL
LIMIT 10;
