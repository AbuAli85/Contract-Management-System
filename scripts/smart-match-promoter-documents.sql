-- ============================================================================
-- SMART MATCH: Link Files to Promoters by Name + ID/Passport Numbers
-- ============================================================================
-- This script uses the actual naming pattern from storage:
--   ID Card: [name]_[id_card_number].[ext]
--   Passport: [name]_[passport_number].[ext]
--   No Passport: [name]_NO_PASSPORT.[ext]
-- ============================================================================

-- Step 1: Match ID Card files
SELECT 
  '=== STEP 1: ID CARD MATCHES ===' as section,
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
    -- Match by exact pattern: name_idcardnumber
    LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.id_card_number || '.png')
    OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.id_card_number || '.jpeg')
    OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.id_card_number || '.jpg')
    -- Also try matching if filename contains the ID card number
    OR (
      LOWER(o.name) LIKE '%' || LOWER(p.id_card_number) || '%'
      AND LOWER(o.name) LIKE '%' || LOWER(SUBSTRING(REPLACE(p.name_en, ' ', '_'), 1, 10)) || '%'
      AND LOWER(o.name) NOT LIKE '%passport%'
      AND LOWER(o.name) NOT LIKE '%no_passport%'
    )
  )
WHERE p.id_card_url IS NULL
ORDER BY p.name_en;

-- Step 2: Match Passport files
SELECT 
  '=== STEP 2: PASSPORT MATCHES ===' as section,
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
    -- Match by exact pattern: name_passportnumber
    LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.passport_number || '.png')
    OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.passport_number || '.jpeg')
    OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_' || p.passport_number || '.jpg')
    -- Also try matching if filename contains the passport number
    OR (
      LOWER(o.name) LIKE '%' || LOWER(p.passport_number) || '%'
      AND LOWER(o.name) LIKE '%' || LOWER(SUBSTRING(REPLACE(p.name_en, ' ', '_'), 1, 10)) || '%'
    )
    -- Handle NO_PASSPORT cases
    OR (
      LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_NO_PASSPORT.png')
      OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_NO_PASSPORT.jpeg')
      OR LOWER(o.name) = LOWER(REPLACE(p.name_en, ' ', '_') || '_NO_PASSPORT.jpg')
    )
  )
WHERE p.passport_url IS NULL
ORDER BY p.name_en;

-- Step 3: Count statistics
SELECT 
  '=== STEP 3: MATCHING STATISTICS ===' as section,
  COUNT(DISTINCT p.id) as total_promoters_needing_urls,
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.objects o
      WHERE o.bucket_id = 'promoter-documents'
        AND LOWER(o.name) LIKE '%' || LOWER(p.id_card_number) || '%'
    ) THEN p.id 
  END) as promoters_with_id_card_match,
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.objects o
      WHERE o.bucket_id = 'promoter-documents'
        AND (LOWER(o.name) LIKE '%' || LOWER(p.passport_number) || '%'
             OR LOWER(o.name) LIKE '%no_passport%')
    ) THEN p.id 
  END) as promoters_with_passport_match
FROM promoters p
WHERE p.id_card_url IS NULL OR p.passport_url IS NULL;

-- ============================================================================
-- 🔧 INSTRUCTIONS:
-- ============================================================================
-- 1. Review Step 1 matches (ID Cards) - verify they look correct
-- 2. Review Step 2 matches (Passports) - verify they look correct
-- 3. If matches are correct, copy ALL UPDATE statements and run them
-- 4. After running, verify with the query below
-- ============================================================================

-- ============================================================================
-- ✅ VERIFICATION QUERY (Run after updates):
-- ============================================================================
-- SELECT 
--   COUNT(*) as total,
--   COUNT(id_card_url) as have_id_card_url,
--   COUNT(passport_url) as have_passport_url,
--   COUNT(CASE WHEN id_card_url LIKE 'https://%' THEN 1 END) as id_card_full_urls,
--   COUNT(CASE WHEN passport_url LIKE 'https://%' THEN 1 END) as passport_full_urls
-- FROM promoters;
-- ============================================================================

