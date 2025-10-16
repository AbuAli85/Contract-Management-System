-- ============================================================================
-- CHECK EMPLOYERS AND THEIR ALIGNMENT WITH PROMOTERS
-- ============================================================================
-- This script shows:
-- 1. All employers in the parties table
-- 2. How many promoters are assigned to each employer
-- 3. Promoters without employers
-- ============================================================================

-- 1. List all employers
SELECT 
  '=== ALL EMPLOYERS ===' as section,
  id,
  name_en,
  name_ar,
  type,
  crn as commercial_reg,
  status,
  overall_status
FROM parties
WHERE type = 'Employer'
ORDER BY name_en;

-- 2. Count promoters per employer
SELECT 
  '=== PROMOTERS PER EMPLOYER ===' as section,
  p.name_en as employer_name,
  p.id as employer_id,
  COUNT(pr.id) as promoter_count,
  ARRAY_AGG(pr.name_en) FILTER (WHERE pr.name_en IS NOT NULL) as promoter_names
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en
ORDER BY promoter_count DESC, p.name_en;

-- 3. Promoters WITHOUT employer assigned
SELECT 
  '=== PROMOTERS WITHOUT EMPLOYER ===' as section,
  COUNT(*) as promoters_without_employer
FROM promoters
WHERE employer_id IS NULL;

-- 4. Show sample of promoters without employer
SELECT 
  '=== SAMPLE PROMOTERS WITHOUT EMPLOYER ===' as section,
  id,
  name_en,
  job_title,
  status,
  id_card_number
FROM promoters
WHERE employer_id IS NULL
LIMIT 10;

-- 5. Summary statistics
SELECT 
  '=== SUMMARY ===' as section,
  (SELECT COUNT(*) FROM parties WHERE type = 'Employer') as total_employers,
  (SELECT COUNT(*) FROM promoters) as total_promoters,
  (SELECT COUNT(*) FROM promoters WHERE employer_id IS NOT NULL) as promoters_with_employer,
  (SELECT COUNT(*) FROM promoters WHERE employer_id IS NULL) as promoters_without_employer,
  ROUND(
    (SELECT COUNT(*)::DECIMAL FROM promoters WHERE employer_id IS NOT NULL) / 
    NULLIF((SELECT COUNT(*)::DECIMAL FROM promoters), 0) * 100, 
    2
  ) as percentage_assigned;

-- 6. Check for invalid employer_id references (orphaned records)
SELECT 
  '=== INVALID EMPLOYER REFERENCES ===' as section,
  pr.id as promoter_id,
  pr.name_en as promoter_name,
  pr.employer_id as invalid_employer_id
FROM promoters pr
WHERE pr.employer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM parties p WHERE p.id = pr.employer_id);

-- ============================================================================
-- EXPECTED OUTPUT:
-- - List of all employers
-- - Distribution of promoters across employers
-- - Promoters that need employer assignment
-- - Data quality issues (if any)
-- ============================================================================

