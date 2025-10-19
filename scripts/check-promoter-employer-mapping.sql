-- ============================================================================
-- PROMOTER-EMPLOYER MAPPING DIAGNOSTIC SCRIPT
-- ============================================================================
-- This script checks the current state of promoter-employer relationships
-- and identifies any mapping issues
-- ============================================================================

-- 1. Check if employer_id column exists in promoters table
SELECT 
  '=== EMPLOYER_ID COLUMN CHECK ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'employer_id'
    ) THEN '✅ employer_id column EXISTS'
    ELSE '❌ employer_id column MISSING'
  END as status;

-- 2. Check foreign key constraint
SELECT 
  '=== FOREIGN KEY CONSTRAINT CHECK ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'promoters' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'employer_id'
    ) THEN '✅ Foreign key constraint EXISTS'
    ELSE '❌ Foreign key constraint MISSING'
  END as status;

-- 3. Check index on employer_id
SELECT 
  '=== INDEX CHECK ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'promoters' AND indexname = 'idx_promoters_employer_id'
    ) THEN '✅ Index EXISTS'
    ELSE '❌ Index MISSING'
  END as status;

-- 4. Count promoters with and without employer assignments
SELECT 
  '=== PROMOTER EMPLOYER ASSIGNMENT SUMMARY ===' as section,
  COUNT(*) as total_promoters,
  COUNT(employer_id) as promoters_with_employer,
  COUNT(*) - COUNT(employer_id) as promoters_without_employer,
  ROUND(
    (COUNT(employer_id)::decimal / COUNT(*)) * 100, 2
  ) as percentage_assigned
FROM promoters;

-- 5. List all employers and their promoter counts
SELECT 
  '=== EMPLOYERS AND THEIR PROMOTER COUNTS ===' as section,
  p.id as employer_id,
  p.name_en as employer_name,
  p.type as employer_type,
  COUNT(pr.id) as promoter_count,
  ARRAY_AGG(pr.name_en) FILTER (WHERE pr.name_en IS NOT NULL) as promoter_names
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en, p.type
ORDER BY promoter_count DESC, p.name_en;

-- 6. Promoters without employer assignment
SELECT 
  '=== PROMOTERS WITHOUT EMPLOYER ===' as section,
  pr.id,
  pr.name_en,
  pr.name_ar,
  pr.id_card_number,
  pr.status,
  pr.created_at
FROM promoters pr
WHERE pr.employer_id IS NULL
ORDER BY pr.created_at DESC;

-- 7. Check for orphaned employer_id references (promoters pointing to non-existent employers)
SELECT 
  '=== ORPHANED EMPLOYER REFERENCES ===' as section,
  pr.id as promoter_id,
  pr.name_en as promoter_name,
  pr.employer_id as orphaned_employer_id
FROM promoters pr
LEFT JOIN parties p ON p.id = pr.employer_id
WHERE pr.employer_id IS NOT NULL 
AND p.id IS NULL;

-- 8. Sample promoter data with employer information
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

-- 9. Check contract generation data flow
SELECT 
  '=== CONTRACT GENERATION DATA FLOW CHECK ===' as section,
  c.id as contract_id,
  c.contract_number,
  c.promoter_id,
  pr.name_en as promoter_name,
  pr.employer_id as promoter_employer_id,
  c.first_party_id,
  fp.name_en as first_party_name,
  c.second_party_id,
  sp.name_en as second_party_name,
  CASE 
    WHEN pr.employer_id = c.second_party_id THEN '✅ PROMOTER-EMPLOYER MATCH'
    WHEN pr.employer_id IS NULL THEN '⚠️ PROMOTER HAS NO EMPLOYER'
    ELSE '❌ PROMOTER-EMPLOYER MISMATCH'
  END as mapping_status
FROM contracts c
LEFT JOIN promoters pr ON pr.id::text = c.promoter_id::text
LEFT JOIN parties fp ON fp.id = c.first_party_id
LEFT JOIN parties sp ON sp.id = c.second_party_id
ORDER BY c.created_at DESC
LIMIT 5;
