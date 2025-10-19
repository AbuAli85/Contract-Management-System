-- ============================================================================
-- FIX PROMOTER-EMPLOYER MAPPING ISSUES
-- ============================================================================
-- This script fixes common promoter-employer mapping issues
-- ============================================================================

-- 1. Ensure employer_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promoters' AND column_name = 'employer_id'
  ) THEN
    ALTER TABLE promoters ADD COLUMN employer_id UUID;
    RAISE NOTICE 'Added employer_id column to promoters table';
  ELSE
    RAISE NOTICE 'employer_id column already exists';
  END IF;
END $$;

-- 2. Ensure foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'promoters' 
    AND tc.constraint_name = 'promoters_employer_id_fkey'
  ) THEN
    ALTER TABLE promoters 
    ADD CONSTRAINT promoters_employer_id_fkey
    FOREIGN KEY (employer_id) REFERENCES parties(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- 3. Ensure index exists
CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id);

-- 4. Fix promoter-employer mapping based on contract data
-- This assumes that if a promoter is in a contract with a second_party (employer),
-- that second_party should be their employer
UPDATE promoters 
SET employer_id = (
  SELECT DISTINCT c.second_party_id 
  FROM contracts c 
  WHERE c.promoter_id::text = promoters.id::text 
  AND c.second_party_id IS NOT NULL
  LIMIT 1
)
WHERE employer_id IS NULL 
AND EXISTS (
  SELECT 1 FROM contracts c 
  WHERE c.promoter_id::text = promoters.id::text 
  AND c.second_party_id IS NOT NULL
);

-- 5. Assign unassigned promoters to a default employer if needed
-- First, check if we have any employers
DO $$
DECLARE
  default_employer_id UUID;
  unassigned_count INTEGER;
BEGIN
  -- Get the first available employer
  SELECT id INTO default_employer_id 
  FROM parties 
  WHERE type = 'Employer' 
  ORDER BY name_en 
  LIMIT 1;
  
  -- Count unassigned promoters
  SELECT COUNT(*) INTO unassigned_count 
  FROM promoters 
  WHERE employer_id IS NULL;
  
  IF default_employer_id IS NOT NULL AND unassigned_count > 0 THEN
    -- Update unassigned promoters
    UPDATE promoters 
    SET employer_id = default_employer_id 
    WHERE employer_id IS NULL;
    
    RAISE NOTICE 'Assigned % unassigned promoters to default employer: %', 
      unassigned_count, 
      (SELECT name_en FROM parties WHERE id = default_employer_id);
  ELSE
    RAISE NOTICE 'No default employer found or no unassigned promoters';
  END IF;
END $$;

-- 6. Clean up orphaned references (promoters pointing to non-existent employers)
UPDATE promoters 
SET employer_id = NULL 
WHERE employer_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM parties p 
  WHERE p.id = promoters.employer_id
);

-- 7. Verify the fixes
SELECT 
  '=== POST-FIX VERIFICATION ===' as section,
  COUNT(*) as total_promoters,
  COUNT(employer_id) as promoters_with_employer,
  COUNT(*) - COUNT(employer_id) as promoters_without_employer,
  ROUND(
    (COUNT(employer_id)::decimal / COUNT(*)) * 100, 2
  ) as percentage_assigned
FROM promoters;

-- 8. Show final mapping status
SELECT 
  '=== FINAL MAPPING STATUS ===' as section,
  p.name_en as employer_name,
  COUNT(pr.id) as promoter_count
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en
ORDER BY promoter_count DESC;
