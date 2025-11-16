-- ============================================================================
-- FIX KASHIF ALI PASSPORT URL
-- ============================================================================
-- Current: kashif_ali_NO_PASSPORT.png (placeholder)
-- Action: Set to NULL or find correct passport image
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT STATUS
-- ============================================================================

SELECT 
  '=== CURRENT STATUS ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  'NO_PASSPORT placeholder' as current_status
FROM promoters
WHERE name_en = 'kashif ali'
  AND passport_url LIKE '%NO_PASSPORT%';

-- ============================================================================
-- STEP 2: CHECK IF CORRECT PASSPORT FILE EXISTS IN STORAGE
-- ============================================================================
-- Run this to check if a correct passport image exists for kashif ali

/*
SELECT 
  '=== CHECKING STORAGE FOR CORRECT FILE ===' as section,
  o.name as filename,
  CASE 
    WHEN o.name LIKE '%kashif_ali%' 
         AND o.name NOT LIKE '%NO_PASSPORT%'
         AND (passport_number IS NULL OR o.name LIKE '%' || passport_number || '%')
    THEN '✅ Found potential correct file'
    ELSE 'Other file'
  END as match_status,
  o.created_at,
  ROUND((o.metadata->>'size')::numeric / 1024, 2) as file_size_kb
FROM storage.objects o
CROSS JOIN promoters p
WHERE o.bucket_id = 'promoter-documents'
  AND p.name_en = 'kashif ali'
  AND (
    o.name LIKE '%kashif_ali%'
    OR (p.passport_number IS NOT NULL AND o.name LIKE '%' || p.passport_number || '%')
  )
ORDER BY match_status DESC, o.name;
*/

-- ============================================================================
-- STEP 3: FIX OPTIONS
-- ============================================================================

-- Option A: Set to NULL (Recommended - since it's a NO_PASSPORT placeholder)
-- This is the cleanest approach - NULL explicitly means no passport image
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'kashif ali'
  AND passport_url LIKE '%NO_PASSPORT%';

-- Option B: If correct passport file exists, update to correct URL
-- Uncomment and update filename if you find the correct file:
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[correct_filename]',
  updated_at = NOW()
WHERE name_en = 'kashif ali'
  AND passport_number = '[passport_number]';
*/

-- ============================================================================
-- STEP 4: VERIFY FIX
-- ============================================================================

SELECT 
  '=== VERIFICATION AFTER FIX ===' as section,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url IS NULL THEN '✅ Set to NULL (no passport image)'
    WHEN passport_url LIKE '%NO_PASSPORT%' THEN '❌ Still has NO_PASSPORT placeholder'
    WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN '✅ Has valid passport URL'
    ELSE 'Other status'
  END as status
FROM promoters
WHERE name_en = 'kashif ali';

