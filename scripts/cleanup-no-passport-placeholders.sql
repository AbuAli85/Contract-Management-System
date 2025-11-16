-- ============================================================================
-- CLEANUP NO_PASSPORT PLACEHOLDERS
-- ============================================================================
-- This script sets NO_PASSPORT placeholder URLs to NULL
-- This makes it clearer that no passport image exists
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW - See what will be changed
-- ============================================================================

SELECT 
  '=== PREVIEW: Promoters with NO_PASSPORT placeholders ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  'Will be set to NULL' as action
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 2: COUNT BEFORE CLEANUP
-- ============================================================================

SELECT 
  '=== BEFORE CLEANUP ===' as section,
  COUNT(*) as total_no_passport_placeholders
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%';

-- ============================================================================
-- STEP 3: PERFORM CLEANUP - Set NO_PASSPORT to NULL
-- ============================================================================
-- UNCOMMENT THE FOLLOWING BLOCK TO EXECUTE THE CLEANUP
-- Make sure to review the preview first!

/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE passport_url LIKE '%NO_PASSPORT%';

-- Verify the update
SELECT 
  '=== AFTER CLEANUP ===' as section,
  COUNT(*) as remaining_no_passport_placeholders
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%';
*/

-- ============================================================================
-- STEP 4: VERIFY FINAL STATUS
-- ============================================================================

SELECT 
  '=== FINAL STATUS AFTER CLEANUP ===' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN 1 END) as valid_passport_urls,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as null_passport_urls,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as remaining_placeholders
FROM promoters;

