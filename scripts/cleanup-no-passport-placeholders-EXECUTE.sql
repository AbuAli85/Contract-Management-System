-- ============================================================================
-- EXECUTE: Cleanup NO_PASSPORT Placeholders
-- ============================================================================
-- This script sets all NO_PASSPORT placeholder URLs to NULL
-- 
-- IMPORTANT: Review the preview query results first, then uncomment
-- the UPDATE statement below to execute the cleanup.
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW - See what will be changed (SAFE - READ ONLY)
-- ============================================================================

SELECT 
  id,
  name_en,
  passport_number,
  passport_url,
  'Will be set to NULL' as action
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 1.5: SPECIFIC FIX - kashif ali
-- ============================================================================
-- Quick fix for kashif ali NO_PASSPORT placeholder

UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'kashif ali'
  AND passport_url LIKE '%NO_PASSPORT%';

-- ============================================================================
-- STEP 2: COUNT BEFORE CLEANUP
-- ============================================================================

SELECT 
  'BEFORE CLEANUP' as status,
  COUNT(*) as no_passport_placeholders
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%';

-- ============================================================================
-- STEP 3: EXECUTE CLEANUP
-- ============================================================================
-- ⚠️ UNCOMMENT THE FOLLOWING BLOCK TO EXECUTE THE CLEANUP ⚠️
-- Make sure you've reviewed the preview results above first!

/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE passport_url LIKE '%NO_PASSPORT%';
*/

-- ============================================================================
-- STEP 4: VERIFY CLEANUP WAS SUCCESSFUL
-- ============================================================================

SELECT 
  'AFTER CLEANUP' as status,
  COUNT(*) as remaining_placeholders
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%';

-- ============================================================================
-- STEP 5: FINAL STATUS CHECK
-- ============================================================================

SELECT 
  'FINAL STATUS' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN 1 END) as valid_passport_urls,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as null_passport_urls,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as remaining_placeholders
FROM promoters;

