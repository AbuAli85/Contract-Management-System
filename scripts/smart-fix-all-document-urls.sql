-- SMART FIX: Bulk Update All Missing Document URLs
-- Based on actual file naming patterns in storage
-- Run this in your Supabase SQL Editor

-- =================================================================
-- STEP 1: Update ID Card URLs (using .png extension)
-- =================================================================

UPDATE promoters
SET 
    id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_' || id_card_number || '.png',
    updated_at = NOW()
WHERE id_card_url IS NULL 
  AND id_card_number IS NOT NULL 
  AND id_card_number != '';

-- =================================================================
-- STEP 2: Update ID Card URLs (try .jpeg extension for any still missing)
-- =================================================================

UPDATE promoters
SET 
    id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_' || id_card_number || '.jpeg',
    updated_at = NOW()
WHERE id_card_url IS NULL 
  AND id_card_number IS NOT NULL 
  AND id_card_number != '';

-- =================================================================
-- STEP 3: Update Passport URLs (lowercase passport number)
-- =================================================================

UPDATE promoters
SET 
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_' || lower(passport_number) || '.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL 
  AND passport_number != '';

-- =================================================================
-- STEP 4: Update Passport URLs (UPPERCASE passport number - for files like BS5165582)
-- =================================================================

UPDATE promoters
SET 
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_' || upper(passport_number) || '.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL 
  AND passport_number != '';

-- =================================================================
-- STEP 5: Update Passport URLs (try .jpeg extension)
-- =================================================================

UPDATE promoters
SET 
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_' || lower(passport_number) || '.jpeg',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL 
  AND passport_number != '';

-- =================================================================
-- STEP 6: Try "NO_PASSPORT" placeholder for still missing
-- =================================================================

UPDATE promoters
SET 
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_NO_PASSPORT.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL 
  AND passport_number != '';

-- =================================================================
-- STEP 7: Try "NO_PASSPORT" with .jpeg
-- =================================================================

UPDATE promoters
SET 
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
        lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
        '_NO_PASSPORT.jpeg',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL 
  AND passport_number != '';

-- =================================================================
-- VERIFICATION: Show Results
-- =================================================================

SELECT 
    '=== SUMMARY ===' as section,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN id_card_url IS NOT NULL THEN 1 END) as promoters_with_id_card_url,
    COUNT(CASE WHEN passport_url IS NOT NULL THEN 1 END) as promoters_with_passport_url,
    COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) as complete_docs,
    ROUND(100.0 * COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0), 1) || '%' as completion_percentage
FROM promoters;

-- Show remaining issues
SELECT 
    '=== STILL MISSING ===' as section,
    id,
    name_en,
    id_card_number,
    passport_number,
    id_card_url,
    passport_url
FROM promoters
WHERE id_card_url IS NULL OR passport_url IS NULL
ORDER BY name_en
LIMIT 50;

