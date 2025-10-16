-- ============================================================================
-- CONVERT PARTIAL URLs TO FULL SUPABASE STORAGE URLs
-- ============================================================================
-- Fixes Make.com "URL should not be empty" error by converting filenames
-- to full https:// URLs that Google Docs API can access
-- ============================================================================

-- IMPORTANT: Replace [YOUR-PROJECT-ID] with your actual Supabase project ID
-- Example: https://abcdefghijklmnop.supabase.co

-- 1. Check current state - shows promoters with partial URLs
SELECT 
  '=== BEFORE: Partial URLs ===' as section,
  COUNT(*) as promoters_with_partial_urls,
  COUNT(CASE WHEN id_card_url NOT LIKE 'https://%' AND id_card_url IS NOT NULL THEN 1 END) as id_cards_need_fixing,
  COUNT(CASE WHEN passport_url NOT LIKE 'https://%' AND passport_url IS NOT NULL THEN 1 END) as passports_need_fixing
FROM promoters;

-- 2. Sample of URLs that need fixing
SELECT 
  '=== SAMPLE: URLs Needing Conversion ===' as section,
  name_en,
  id_card_url as current_id_card_url,
  'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url as will_become_id_card_url,
  passport_url as current_passport_url,
  'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/promoter-documents/' || passport_url as will_become_passport_url
FROM promoters
WHERE (id_card_url IS NOT NULL AND id_card_url NOT LIKE 'https://%')
   OR (passport_url IS NOT NULL AND passport_url NOT LIKE 'https://%')
LIMIT 5;

-- ============================================================================
-- 3. MAIN FIX: Update ID card URLs to full URLs
-- ============================================================================
-- UNCOMMENT AFTER REPLACING [YOUR-PROJECT-ID] WITH YOUR ACTUAL PROJECT ID
/*
UPDATE promoters
SET id_card_url = 'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url
WHERE id_card_url IS NOT NULL 
  AND id_card_url NOT LIKE 'https://%'
  AND id_card_url != '';
*/

-- ============================================================================
-- 4. MAIN FIX: Update passport URLs to full URLs
-- ============================================================================
-- UNCOMMENT AFTER REPLACING [YOUR-PROJECT-ID] WITH YOUR ACTUAL PROJECT ID
/*
UPDATE promoters
SET passport_url = 'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/promoter-documents/' || passport_url
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE 'https://%'
  AND passport_url != '';
*/

-- ============================================================================
-- 5. OPTIONAL: Set placeholder URLs for promoters without images
-- ============================================================================
-- This ensures ALL promoters have valid image URLs
-- UNCOMMENT if you want placeholders for missing images
/*
UPDATE promoters
SET id_card_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop'
WHERE id_card_url IS NULL OR id_card_url = '';

UPDATE promoters
SET passport_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
WHERE passport_url IS NULL OR passport_url = '';
*/

-- ============================================================================
-- 6. VERIFY: Check results after running the updates
-- ============================================================================
SELECT 
  '=== AFTER: Full URLs ===' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN id_card_url LIKE 'https://%' THEN 1 END) as id_cards_with_full_url,
  COUNT(CASE WHEN passport_url LIKE 'https://%' THEN 1 END) as passports_with_full_url,
  COUNT(CASE WHEN id_card_url NOT LIKE 'https://%' AND id_card_url IS NOT NULL THEN 1 END) as id_cards_still_partial,
  COUNT(CASE WHEN passport_url NOT LIKE 'https://%' AND passport_url IS NOT NULL THEN 1 END) as passports_still_partial
FROM promoters;

-- 7. Sample of converted URLs (verify they look correct)
SELECT 
  '=== SAMPLE: Converted URLs ===' as section,
  name_en,
  id_card_url,
  passport_url
FROM promoters
WHERE (id_card_url IS NOT NULL OR passport_url IS NOT NULL)
LIMIT 10;

-- ============================================================================
-- EXPECTED RESULTS:
-- BEFORE:
-- - 49 ID cards with partial URLs (filenames only)
-- - 24 passports with partial URLs (filenames only)
--
-- AFTER:
-- - 49 ID cards with full https:// URLs
-- - 24 passports with full https:// URLs
-- - All URLs accessible via browser
-- - Make.com can now use these URLs successfully
-- ============================================================================

-- ============================================================================
-- HOW TO FIND YOUR PROJECT ID:
-- 1. Go to Supabase Dashboard
-- 2. Look at your project URL
-- 3. It's the part before .supabase.co
-- Example: https://abcdefghijklmnop.supabase.co
--          Your ID is: abcdefghijklmnop
-- ============================================================================

