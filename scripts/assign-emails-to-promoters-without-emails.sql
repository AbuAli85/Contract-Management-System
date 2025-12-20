-- ============================================================================
-- ASSIGN EMAILS TO PROMOTERS WITHOUT EMAILS
-- ============================================================================
-- This script assigns unique email addresses to promoters that don't have emails
-- Format: firstname.lastname.promoterid@falconeyegroup.net
-- ============================================================================

-- ============================================================================
-- PART 1: BACKUP AND PREVIEW
-- ============================================================================

-- Show promoters that will get emails assigned
SELECT 
  '=== PROMOTERS THAT WILL GET EMAILS ASSIGNED ===' as section;

SELECT 
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.email as current_email,
  CASE 
    WHEN p.name_en IS NOT NULL AND TRIM(p.name_en) != '' THEN
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9\s]', '', 'g'),
            '\s+', '.', 'g'
          ),
          '^\.|\.$', '', 'g'
        )
      ) || '.' || REPLACE(p.id::text, '-', '') || '@falconeyegroup.net'
    ELSE
      'promoter.' || REPLACE(p.id::text, '-', '') || '@falconeyegroup.net'
  END as proposed_email
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (p.email IS NULL OR TRIM(p.email) = '')
ORDER BY p.name_en;

-- ============================================================================
-- PART 2: ASSIGN EMAILS
-- ============================================================================

-- Update promoters without emails
UPDATE promoters p
SET 
  email = CASE 
    WHEN p.name_en IS NOT NULL AND TRIM(p.name_en) != '' THEN
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9\s]', '', 'g'),
            '\s+', '.', 'g'
          ),
          '^\.|\.$', '', 'g'
        )
      ) || '.' || REPLACE(p.id::text, '-', '') || '@falconeyegroup.net'
    ELSE
      'promoter.' || REPLACE(p.id::text, '-', '') || '@falconeyegroup.net'
  END,
  updated_at = NOW()
FROM parties pt
WHERE pt.id = p.employer_id
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND (p.email IS NULL OR TRIM(p.email) = '');

-- Report results
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMAIL ASSIGNMENT COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Promoters assigned emails: %', v_updated;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify no duplicate emails were created';
  RAISE NOTICE '2. Register promoters via API or Supabase Admin API';
  RAISE NOTICE '3. Create employer_employee records';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 3: VERIFY NO DUPLICATES
-- ============================================================================

-- Check for any duplicate emails after assignment
SELECT 
  '=== DUPLICATE EMAIL CHECK (After Assignment) ===' as section;

SELECT 
  LOWER(TRIM(p.email)) as email,
  COUNT(DISTINCT p.id) as promoter_count,
  STRING_AGG(DISTINCT p.name_en, ' | ' ORDER BY p.name_en) as promoter_names
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
GROUP BY LOWER(TRIM(p.email))
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC;

-- If duplicates found, show warning
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT LOWER(TRIM(p.email)) as email
    FROM promoters p
    JOIN parties pt ON pt.id = p.employer_id
    WHERE p.status = 'active'
      AND pt.type = 'Employer'
      AND pt.overall_status = 'active'
      AND p.email IS NOT NULL
      AND TRIM(p.email) != ''
    GROUP BY LOWER(TRIM(p.email))
    HAVING COUNT(DISTINCT p.id) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING '⚠️  WARNING: % duplicate email groups found!', v_duplicate_count;
    RAISE WARNING 'You may need to manually fix these duplicates.';
  ELSE
    RAISE NOTICE '✅ No duplicate emails found. All emails are unique!';
  END IF;
END $$;

