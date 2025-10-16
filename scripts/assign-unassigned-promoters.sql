-- ============================================================================
-- ASSIGN 8 UNASSIGNED PROMOTERS TO EMPLOYER
-- ============================================================================
-- These 8 promoters were added on Aug 20, 2025 and need employer assignment
-- Recommended: Assign to "Falcon Eye Business and Promotion" (largest employer)
-- ============================================================================

-- Step 1: Get the employer ID for Falcon Eye Business and Promotion
-- (You can change this to any employer you prefer)
WITH target_employer AS (
  SELECT id, name_en 
  FROM parties 
  WHERE name_en = 'Falcon Eye Business and Promotion' 
  AND type = 'Employer'
  LIMIT 1
)

-- Step 2: Assign all 8 unassigned promoters to this employer
UPDATE promoters
SET 
  employer_id = (SELECT id FROM target_employer),
  updated_at = NOW()
WHERE employer_id IS NULL
RETURNING 
  id,
  name_en,
  (SELECT name_en FROM target_employer) as assigned_to_employer;

-- ============================================================================
-- ALTERNATIVE OPTIONS (comment out the above, uncomment one below):
-- ============================================================================

-- Option A: Assign to Falcon Eye Modern Investments SPC (2nd largest)
/*
UPDATE promoters
SET employer_id = (SELECT id FROM parties WHERE name_en = 'Falcon Eye Modern Investments SPC' LIMIT 1)
WHERE employer_id IS NULL;
*/

-- Option B: Assign to Amjad Al Maerifa LLC
/*
UPDATE promoters
SET employer_id = (SELECT id FROM parties WHERE name_en = 'Amjad Al Maerifa LLC' LIMIT 1)
WHERE employer_id IS NULL;
*/

-- Option C: Assign to Quality project management
/*
UPDATE promoters
SET employer_id = (SELECT id FROM parties WHERE name_en = 'Quality project management' LIMIT 1)
WHERE employer_id IS NULL;
*/

-- Option D: Distribute evenly among top 3 Falcon Eye companies
/*
WITH ranked_promoters AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM promoters
  WHERE employer_id IS NULL
),
employers AS (
  SELECT id, name_en,
    ROW_NUMBER() OVER (ORDER BY name_en) as emp_num
  FROM parties
  WHERE name_en IN (
    'Falcon Eye Business and Promotion',
    'Falcon Eye Modern Investments SPC',
    'Falcon Eye Promotion and Investment'
  )
)
UPDATE promoters p
SET employer_id = e.id
FROM ranked_promoters rp
JOIN employers e ON ((rp.rn - 1) % 3 + 1) = e.emp_num
WHERE p.id = rp.id;
*/

-- ============================================================================
-- VERIFICATION: Check the assignment worked
-- ============================================================================

SELECT 
  'After Assignment' as status,
  COUNT(*) FILTER (WHERE employer_id IS NULL) as still_unassigned,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL) as now_assigned
FROM promoters;

-- Show the distribution after assignment
SELECT 
  p.name_en as employer_name,
  COUNT(pr.id) as promoter_count
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en
ORDER BY promoter_count DESC;

