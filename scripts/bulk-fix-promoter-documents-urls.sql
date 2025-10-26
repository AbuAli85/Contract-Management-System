-- Bulk Fix Promoter Document URLs
-- This script updates missing document URLs for promoters
-- Based on the standard naming pattern: {normalized_name}_{number}.{ext}

-- First, let's see what we're fixing
SELECT 
    id,
    name_en,
    id_card_number,
    passport_number,
    id_card_url,
    passport_url,
    CASE 
        WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 'complete'
        WHEN id_card_url IS NOT NULL OR passport_url IS NOT NULL THEN 'partial'
        ELSE 'missing'
    END as document_status
FROM promoters
WHERE id_card_url IS NULL OR passport_url IS NULL
ORDER BY name_en;

-- Update ID Card URLs for promoters with missing URLs
-- Pattern: {normalized_name}_{id_card_number}.png

UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_' || id_card_number || '.png',
    updated_at = NOW()
WHERE id_card_url IS NULL 
  AND id_card_number IS NOT NULL
  AND id_card_number != '';

-- Try .jpeg extension for those that might use it
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_' || id_card_number || '.jpeg',
    updated_at = NOW()
WHERE id_card_url IS NULL 
  AND id_card_number IS NOT NULL
  AND id_card_number != '';

-- Update Passport URLs for promoters with missing URLs  
-- Try actual passport number first
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_' || passport_number || '.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL
  AND passport_number != '';

-- Try uppercase passport number
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_' || upper(passport_number) || '.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL
  AND passport_number != '';

-- Try .jpeg extension
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_' || passport_number || '.jpeg',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL
  AND passport_number != '';

-- Try NO_PASSPORT placeholder pattern
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(replace(replace(replace(name_en, ' ', '_'), '-', '_'), '''', '')) || '_NO_PASSPORT.png',
    updated_at = NOW()
WHERE passport_url IS NULL 
  AND passport_number IS NOT NULL
  AND passport_number != '';

-- Verification: Show updated counts
SELECT 
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN id_card_url IS NOT NULL THEN 1 END) as with_id_card,
    COUNT(CASE WHEN passport_url IS NOT NULL THEN 1 END) as with_passport,
    COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) as complete,
    COUNT(CASE WHEN id_card_url IS NULL AND passport_url IS NULL THEN 1 END) as missing_both
FROM promoters;

