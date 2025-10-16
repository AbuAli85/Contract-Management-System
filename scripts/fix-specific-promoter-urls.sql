-- ============================================================================
-- FIX IMAGE URLS FOR SPECIFIC PROMOTER
-- ============================================================================
-- This script links storage files to the promoter who's missing URLs
-- Promoter ID: 6badb25a-1403-4eb2-88f5-06d978891f3e
-- ============================================================================

-- Step 1: Check the promoter's current data
SELECT 
  '=== STEP 1: CURRENT PROMOTER DATA ===' as section,
  id,
  name_en,
  name_ar,
  id_card_number,
  passport_number,
  id_card_url,
  passport_url,
  CASE 
    WHEN id_card_url IS NULL THEN '❌ ID Card URL is NULL'
    WHEN id_card_url = '' THEN '❌ ID Card URL is EMPTY'
    WHEN id_card_url NOT LIKE 'https://%' THEN '⚠️ ID Card URL is PARTIAL'
    ELSE '✅ ID Card URL is FULL'
  END as id_card_status,
  CASE 
    WHEN passport_url IS NULL THEN '❌ Passport URL is NULL'
    WHEN passport_url = '' THEN '❌ Passport URL is EMPTY'
    WHEN passport_url NOT LIKE 'https://%' THEN '⚠️ Passport URL is PARTIAL'
    ELSE '✅ Passport URL is FULL'
  END as passport_status
FROM promoters
WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e';

-- Step 2: Find files in storage that might match this promoter
SELECT 
  '=== STEP 2: POTENTIAL MATCHING FILES IN STORAGE ===' as section,
  o.name as filename,
  o.bucket_id,
  o.metadata->>'size' as size_bytes,
  o.metadata->>'mimetype' as mime_type,
  o.created_at,
  -- Generate full URL
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || o.name as full_url
FROM storage.objects o
WHERE o.bucket_id = 'promoter-documents'
  -- Try to match by name pattern or created date
  AND (
    -- If we can match by ID card or passport number (from promoter table)
    o.name LIKE '%' || (SELECT id_card_number FROM promoters WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e') || '%'
    OR o.name LIKE '%' || (SELECT passport_number FROM promoters WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e') || '%'
    -- Or match by promoter name (if files are named that way)
    OR LOWER(o.name) LIKE '%' || LOWER(REPLACE((SELECT name_en FROM promoters WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e'), ' ', '_')) || '%'
  )
ORDER BY o.created_at DESC;

-- Step 3: Show ALL files for manual review (if no automatic matches)
SELECT 
  '=== STEP 3: ALL FILES IN STORAGE (FOR MANUAL REVIEW) ===' as section,
  name as filename,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || name as full_url
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 🔧 MANUAL UPDATE INSTRUCTIONS
-- ============================================================================
-- After reviewing the files above, manually update the promoter with correct URLs:
-- 
-- TEMPLATE (replace the filenames with actual ones from Step 2 or 3):
-- 
-- UPDATE promoters
-- SET 
--   id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ACTUAL_ID_CARD_FILENAME.jpg',
--   passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ACTUAL_PASSPORT_FILENAME.jpg',
--   updated_at = NOW()
-- WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e';
-- 
-- ============================================================================

-- Step 4: If you know the exact filenames, uncomment and run this:
-- 
-- UPDATE promoters
-- SET 
--   id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[FILENAME_HERE]',
--   passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[FILENAME_HERE]',
--   updated_at = NOW()
-- WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e';

-- Step 5: Verify the update
SELECT 
  '=== STEP 5: VERIFY UPDATE ===' as section,
  id,
  name_en,
  id_card_url,
  passport_url,
  CASE 
    WHEN id_card_url LIKE 'https://%' THEN '✅ ID Card URL is FULL'
    WHEN id_card_url IS NULL THEN '❌ ID Card URL is NULL'
    ELSE '⚠️ ID Card URL needs fixing'
  END as id_card_status,
  CASE 
    WHEN passport_url LIKE 'https://%' THEN '✅ Passport URL is FULL'
    WHEN passport_url IS NULL THEN '❌ Passport URL is NULL'
    ELSE '⚠️ Passport URL needs fixing'
  END as passport_status
FROM promoters
WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e';

-- ============================================================================
-- 📝 NOTES:
-- ============================================================================
-- This promoter's image URLs are not populated. You need to:
-- 1. Review Step 2 or Step 3 to find the correct filenames
-- 2. Manually construct the UPDATE statement with those filenames
-- 3. Run the UPDATE
-- 4. Verify with Step 5
-- 5. Re-test Make.com scenario
-- ============================================================================

