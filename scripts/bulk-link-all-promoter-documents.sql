-- ============================================================================
-- BULK LINK ALL PROMOTER DOCUMENTS FROM STORAGE TO DATABASE
-- ============================================================================
-- This script matches files in storage to promoters and generates UPDATE statements
-- to populate the id_card_url and passport_url columns
-- ============================================================================

-- Step 1: Show current situation (all promoters with missing URLs)
SELECT 
  '=== STEP 1: PROMOTERS WITH MISSING URLS ===' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN id_card_url IS NULL THEN 1 END) as missing_id_card_url,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as missing_passport_url
FROM promoters;

-- Step 2: List all files in storage with metadata
SELECT 
  '=== STEP 2: ALL FILES IN STORAGE ===' as section,
  name as filename,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || name as full_url
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
ORDER BY name;

-- Step 3: Try to match files to promoters by ID card number
SELECT 
  '=== STEP 3: ID CARD MATCHES ===' as section,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.id_card_number,
  o.name as matched_filename,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || o.name as full_url,
  -- Generate UPDATE statement
  'UPDATE promoters SET id_card_url = ''https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
  o.name || ''', updated_at = NOW() WHERE id = ''' || p.id || ''';' as update_statement
FROM promoters p
JOIN storage.objects o ON o.bucket_id = 'promoter-documents'
  AND (
    -- Match by ID card number in filename
    LOWER(o.name) LIKE '%' || LOWER(p.id_card_number) || '%'
    OR LOWER(o.name) LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%id%'
    OR LOWER(o.name) LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%card%'
  )
  AND (
    -- Likely ID card files (not passport)
    LOWER(o.name) NOT LIKE '%passport%'
    OR LOWER(o.name) LIKE '%id%'
    OR LOWER(o.name) LIKE '%card%'
  )
WHERE p.id_card_url IS NULL
ORDER BY p.name_en;

-- Step 4: Try to match files to promoters by passport number
SELECT 
  '=== STEP 4: PASSPORT MATCHES ===' as section,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.passport_number,
  o.name as matched_filename,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || o.name as full_url,
  -- Generate UPDATE statement
  'UPDATE promoters SET passport_url = ''https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
  o.name || ''', updated_at = NOW() WHERE id = ''' || p.id || ''';' as update_statement
FROM promoters p
JOIN storage.objects o ON o.bucket_id = 'promoter-documents'
  AND (
    -- Match by passport number in filename
    LOWER(o.name) LIKE '%' || LOWER(p.passport_number) || '%'
    OR LOWER(o.name) LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%passport%'
  )
  AND LOWER(o.name) LIKE '%passport%'
WHERE p.passport_url IS NULL
ORDER BY p.name_en;

-- Step 5: Show promoters that couldn't be matched (need manual review)
SELECT 
  '=== STEP 5: PROMOTERS WITHOUT MATCHES (NEED MANUAL REVIEW) ===' as section,
  p.id,
  p.name_en,
  p.id_card_number,
  p.passport_number,
  '-- No automatic match found. Check storage files manually.' as note
FROM promoters p
WHERE p.id_card_url IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'promoter-documents'
      AND (
        LOWER(o.name) LIKE '%' || LOWER(p.id_card_number) || '%'
        OR LOWER(o.name) LIKE '%' || LOWER(p.passport_number) || '%'
        OR LOWER(o.name) LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%'
      )
  )
ORDER BY p.name_en;

-- ============================================================================
-- 🔧 INSTRUCTIONS TO FIX:
-- ============================================================================
-- 1. Review Step 3 (ID Card Matches) and Step 4 (Passport Matches)
-- 2. For each match that looks correct, copy the UPDATE statement and run it
-- 3. Or, run all UPDATE statements at once if matches look accurate
-- 4. For promoters in Step 5 (no matches), manually find files and update
-- 5. After updates, verify with the query below
-- ============================================================================

-- ============================================================================
-- ✅ VERIFICATION QUERY (Run after updates):
-- ============================================================================
-- SELECT 
--   id,
--   name_en,
--   id_card_url,
--   passport_url,
--   CASE WHEN id_card_url LIKE 'https://%' THEN '✅' ELSE '❌' END as id_card_ok,
--   CASE WHEN passport_url LIKE 'https://%' THEN '✅' ELSE '❌' END as passport_ok
-- FROM promoters
-- ORDER BY name_en;
-- ============================================================================

