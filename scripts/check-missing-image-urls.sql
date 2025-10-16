-- ============================================================================
-- CHECK PROMOTERS WITH MISSING IMAGE URLs
-- ============================================================================
-- This helps diagnose "URL should not be empty" errors in Google Docs generation
-- ============================================================================

-- 1. Count promoters by image availability
SELECT 
  '=== IMAGE URL STATISTICS ===' as section,
  COUNT(*) as total_promoters,
  COUNT(id_card_url) as has_id_card_url,
  COUNT(passport_url) as has_passport_url,
  COUNT(CASE WHEN id_card_url IS NULL THEN 1 END) as missing_id_card_url,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as missing_passport_url,
  COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) as has_both_urls
FROM promoters;

-- 2. Promoters with missing ID card URLs
SELECT 
  '=== MISSING ID CARD URLs ===' as section,
  id,
  name_en,
  id_card_number,
  id_card_url,
  status
FROM promoters
WHERE id_card_url IS NULL
ORDER BY name_en
LIMIT 20;

-- 3. Promoters with missing passport URLs
SELECT 
  '=== MISSING PASSPORT URLs ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  status
FROM promoters
WHERE passport_url IS NULL
ORDER BY name_en
LIMIT 20;

-- 4. Promoters with both URLs (working ones)
SELECT 
  '=== PROMOTERS WITH BOTH URLs (Working) ===' as section,
  id,
  name_en,
  id_card_url,
  passport_url
FROM promoters
WHERE id_card_url IS NOT NULL 
  AND passport_url IS NOT NULL
ORDER BY name_en
LIMIT 10;

-- ============================================================================
-- QUICK FIXES:
-- ============================================================================

-- Option A: Set placeholder URLs for missing images
/*
UPDATE promoters
SET id_card_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400'
WHERE id_card_url IS NULL;

UPDATE promoters
SET passport_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400'
WHERE passport_url IS NULL;
*/

-- Option B: Set to empty string (Make.com can handle this better)
/*
UPDATE promoters
SET 
  id_card_url = COALESCE(id_card_url, ''),
  passport_url = COALESCE(passport_url, '')
WHERE id_card_url IS NULL OR passport_url IS NULL;
*/

-- ============================================================================
-- RECOMMENDATION:
-- Update Make.com to use conditional logic:
-- {{if(1.promoter_id_card_url; 1.promoter_id_card_url; "fallback-url")}}
-- ============================================================================

