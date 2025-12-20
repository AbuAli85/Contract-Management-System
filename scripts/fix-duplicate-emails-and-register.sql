-- ============================================================================
-- FIX DUPLICATE EMAILS AND PREPARE FOR REGISTRATION
-- ============================================================================
-- This script:
-- 1. Backs up original emails
-- 2. Generates unique emails for promoters with duplicates
-- 3. Updates promoters table
-- 4. Verifies no duplicates remain
-- ============================================================================

-- Step 1: Add backup column for original email (if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promoters'
      AND column_name = 'original_email'
  ) THEN
    ALTER TABLE promoters
    ADD COLUMN original_email TEXT;
    
    RAISE NOTICE 'Added original_email column to backup current emails';
  ELSE
    RAISE NOTICE 'original_email column already exists';
  END IF;
END $$;

-- Step 2: Backup current emails to original_email
UPDATE promoters
SET original_email = email
WHERE original_email IS NULL
  AND email IS NOT NULL;

-- Step 3: Generate and update unique emails for promoters with duplicates
UPDATE promoters p
SET email = LOWER(
  -- Format: firstname.lastname.promoterid@falconeyegroup.net
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
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  );

-- Step 4: Verify no duplicates remain
DO $$
DECLARE
  v_duplicate_count INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- Count remaining duplicates
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT LOWER(TRIM(email)) as email_lower
    FROM promoters
    WHERE email IS NOT NULL
      AND status = 'active'
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Count updated records
  SELECT COUNT(*) INTO v_updated_count
  FROM promoters
  WHERE original_email IS NOT NULL
    AND email != original_email;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMAIL FIX RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Promoters updated: %', v_updated_count;
  RAISE NOTICE 'Remaining duplicates: %', v_duplicate_count;
  RAISE NOTICE '';
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING 'Some duplicate emails still exist. Review and fix manually.';
  ELSE
    RAISE NOTICE '✅ All emails are now unique! Ready for registration.';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Step 5: Show sample of updated emails
SELECT 
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.original_email as old_email,
  p.email as new_email,
  pt.name_en as employer_name
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.original_email IS NOT NULL
  AND p.email != p.original_email
  AND p.status = 'active'
  AND pt.type = 'Employer'
ORDER BY pt.name_en, p.name_en
LIMIT 20;  -- Show first 20 as sample

-- Step 6: Final verification - check for any remaining duplicates
SELECT 
  'Remaining duplicate emails' as check_type,
  COUNT(*) as count
FROM (
  SELECT LOWER(TRIM(email)) as email_lower
  FROM promoters
  WHERE email IS NOT NULL
    AND status = 'active'
  GROUP BY LOWER(TRIM(email))
  HAVING COUNT(*) > 1
) duplicates;

