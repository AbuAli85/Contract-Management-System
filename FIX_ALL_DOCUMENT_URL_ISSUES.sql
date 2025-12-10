-- Fix All Document URL Issues
-- This script automatically fixes all promoters where document URLs contain "NO_PASSPORT" or "NO_ID"
-- when the actual document numbers exist in the database
--
-- CURRENT STATUS: 39 Passport Issues, 0 ID Card Issues
-- This script will fix all 39 passport URL issues

-- ============================================
-- STEP 1: Fix Passport URLs
-- ============================================
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
    LOWER(REPLACE(passport_number, ' ', '_')) || '.png',
  updated_at = NOW()
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND name_en IS NOT NULL
  AND name_en != '';

-- ============================================
-- STEP 2: Fix ID Card URLs
-- ============================================
UPDATE promoters
SET 
  id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
    LOWER(REPLACE(id_card_number, ' ', '_')) || '.png',
  updated_at = NOW()
WHERE 
  id_card_url IS NOT NULL
  AND id_card_url LIKE '%NO_ID%'
  AND id_card_number IS NOT NULL
  AND id_card_number != ''
  AND name_en IS NOT NULL
  AND name_en != '';

-- ============================================
-- STEP 3: Verify the fixes
-- ============================================
SELECT 
  'VERIFICATION' as report_type,
  COUNT(*) FILTER (WHERE passport_url LIKE '%NO_PASSPORT%' AND passport_number IS NOT NULL AND passport_number != '') as remaining_passport_issues,
  COUNT(*) FILTER (WHERE id_card_url LIKE '%NO_ID%' AND id_card_number IS NOT NULL AND id_card_number != '') as remaining_id_card_issues
FROM promoters;

-- ============================================
-- STEP 4: Show fixed records
-- ============================================
SELECT 
  id,
  name_en,
  id_card_number,
  passport_number,
  id_card_url,
  passport_url,
  updated_at
FROM promoters
WHERE 
  (passport_url LIKE '%NO_PASSPORT%' AND passport_number IS NOT NULL AND passport_number != '')
  OR (id_card_url LIKE '%NO_ID%' AND id_card_number IS NOT NULL AND id_card_number != '')
ORDER BY updated_at DESC, name_en;

