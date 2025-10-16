-- ============================================================================
-- CONVERT PARTIAL URLs TO FULL SUPABASE STORAGE URLs
-- ============================================================================
-- 🚀 READY TO RUN - No modifications needed!
-- Project ID: reootcngcptfogfozlmz
-- Storage Bucket: promoter-documents
-- ============================================================================

-- 1. Preview what will change (SAFE - only shows preview)
SELECT 
  '=== BEFORE: Current State ===' as section,
  name_en,
  id_card_url as current_id_card,
  passport_url as current_passport
FROM promoters
WHERE (id_card_url IS NOT NULL AND id_card_url NOT LIKE 'https://%')
   OR (passport_url IS NOT NULL AND passport_url NOT LIKE 'https://%')
LIMIT 5;

-- 2. Preview what URLs will become (SAFE - only shows preview)
SELECT 
  '=== PREVIEW: What URLs Will Become ===' as section,
  name_en,
  id_card_url as current_id_card,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url as new_id_card,
  passport_url as current_passport,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || passport_url as new_passport
FROM promoters
WHERE (id_card_url IS NOT NULL AND id_card_url NOT LIKE 'https://%')
   OR (passport_url IS NOT NULL AND passport_url NOT LIKE 'https://%')
LIMIT 5;

-- ============================================================================
-- 🔄 MAIN UPDATES - Convert partial URLs to full URLs
-- ============================================================================

-- 3. Update ID card URLs to full URLs
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url
WHERE id_card_url IS NOT NULL 
  AND id_card_url NOT LIKE 'https://%'
  AND id_card_url != '';

-- 4. Update passport URLs to full URLs
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || passport_url
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE 'https://%'
  AND passport_url != '';

-- ============================================================================
-- 🖼️ OPTIONAL: Set placeholder images for missing photos
-- ============================================================================
-- Uncomment if you want ALL promoters to have valid image URLs

/*
UPDATE promoters
SET id_card_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop'
WHERE id_card_url IS NULL OR id_card_url = '';

UPDATE promoters
SET passport_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
WHERE passport_url IS NULL OR passport_url = '';
*/

-- ============================================================================
-- ✅ VERIFICATION - Check results
-- ============================================================================

-- 5. Count promoters by URL status
SELECT 
  '=== AFTER: Results ===' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN id_card_url LIKE 'https://%' THEN 1 END) as id_cards_with_full_url,
  COUNT(CASE WHEN passport_url LIKE 'https://%' THEN 1 END) as passports_with_full_url,
  COUNT(CASE WHEN id_card_url NOT LIKE 'https://%' AND id_card_url IS NOT NULL THEN 1 END) as id_cards_still_partial,
  COUNT(CASE WHEN passport_url NOT LIKE 'https://%' AND passport_url IS NOT NULL THEN 1 END) as passports_still_partial
FROM promoters;

-- 6. Sample of converted URLs
SELECT 
  '=== SAMPLE: Converted URLs ===' as section,
  name_en,
  id_card_url,
  passport_url
FROM promoters
WHERE (id_card_url IS NOT NULL OR passport_url IS NOT NULL)
LIMIT 10;

-- 7. Test a specific URL (replace name if needed)
SELECT 
  '=== TEST: Specific Promoter ===' as section,
  name_en,
  id_card_url,
  passport_url
FROM promoters
WHERE name_en ILIKE '%abdul basit%'
LIMIT 1;

-- ============================================================================
-- 🎯 EXPECTED RESULTS:
-- ============================================================================
-- BEFORE:
-- - 49 ID cards: "filename.jpeg" (partial)
-- - 24 passports: "filename.jpeg" (partial)
--
-- AFTER:
-- - 49 ID cards: "https://reootcngcptfogfozlmz.supabase.co/.../filename.jpeg" (full)
-- - 24 passports: "https://reootcngcptfogfozlmz.supabase.co/.../filename.jpeg" (full)
-- - All URLs work in browser and Make.com
-- ============================================================================

-- ============================================================================
-- 🧪 TESTING:
-- ============================================================================
-- After running, test one URL in your browser:
-- https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
--
-- If it displays the image ✅ - URLs are correct and Make.com will work!
-- If it shows 404 ❌ - Check bucket permissions or file names
-- ============================================================================

