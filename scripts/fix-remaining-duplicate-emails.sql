-- ============================================================================
-- FIX REMAINING DUPLICATE EMAILS
-- ============================================================================
-- This script identifies and fixes any remaining duplicate emails
-- that may have been created during the initial fix
-- ============================================================================

-- Step 1: Identify remaining duplicates
SELECT 
  LOWER(TRIM(email)) as email_lower,
  COUNT(*) as duplicate_count,
  STRING_AGG(p.id::text, ', ' ORDER BY p.id) as promoter_ids,
  STRING_AGG(p.name_en, ' | ' ORDER BY p.id) as promoter_names
FROM promoters p
WHERE email IS NOT NULL
  AND status = 'active'
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Step 2: Fix remaining duplicates by adding more uniqueness
-- Use full UUID (not just first 8 chars) to ensure uniqueness
UPDATE promoters p
SET email = LOWER(
  REGEXP_REPLACE(
    COALESCE(
      p.first_name,
      SPLIT_PART(p.name_en, ' ', 1),
      'promoter'
    ),
    '[^a-zA-Z0-9]', '', 'g'
  ) || '.' ||
  REGEXP_REPLACE(
    COALESCE(
      p.last_name,
      CASE 
        WHEN array_length(string_to_array(p.name_en, ' '), 1) > 1 
        THEN array_to_string((string_to_array(p.name_en, ' '))[2:], ' ')
        ELSE 'user'
      END,
      'user'
    ),
    '[^a-zA-Z0-9]', '', 'g'
  ) || '.' ||
  REPLACE(p.id::text, '-', '') || '@falconeyegroup.net'
),
updated_at = NOW()
WHERE p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  )
  AND EXISTS (
    SELECT 1 FROM parties pt
    WHERE pt.id = p.employer_id
      AND pt.type = 'Employer'
      AND pt.overall_status = 'active'
  );

-- Step 3: Verify no duplicates remain
DO $$
DECLARE
  v_remaining_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_duplicates
  FROM (
    SELECT LOWER(TRIM(email)) as email_lower
    FROM promoters
    WHERE email IS NOT NULL
      AND status = 'active'
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMAINING DUPLICATES FIX';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining duplicates: %', v_remaining_duplicates;
  RAISE NOTICE '';
  
  IF v_remaining_duplicates = 0 THEN
    RAISE NOTICE '✅ All emails are now unique!';
  ELSE
    RAISE WARNING 'Still have % duplicate emails. May need manual review.', v_remaining_duplicates;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Step 4: Show any remaining duplicates (if any)
SELECT 
  'Remaining duplicate emails (if any)' as check_type,
  COUNT(*) as count
FROM (
  SELECT LOWER(TRIM(email)) as email_lower
  FROM promoters
  WHERE email IS NOT NULL
    AND status = 'active'
  GROUP BY LOWER(TRIM(email))
  HAVING COUNT(*) > 1
) duplicates;

