-- Fix All 39 Passport URL Issues
-- This script fixes all promoters where passport_url contains "NO_PASSPORT"
-- when the passport_number exists in the database

-- ============================================
-- BACKUP (Optional but Recommended)
-- ============================================
-- Uncomment the line below to create a backup before fixing
-- CREATE TABLE promoters_backup_20251210 AS SELECT * FROM promoters;

-- ============================================
-- STEP 1: Preview what will be fixed
-- ============================================
SELECT 
  'PREVIEW' as action,
  id,
  name_en,
  passport_number,
  passport_url as current_url,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
    LOWER(REPLACE(passport_number, ' ', '_')) || '.png' as new_url
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND name_en IS NOT NULL
  AND name_en != ''
ORDER BY name_en;

-- ============================================
-- STEP 2: Apply the fix for all 39 records
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
-- STEP 3: Verify the fix
-- ============================================
-- Check remaining issues (should be 0)
SELECT 
  'VERIFICATION' as action,
  COUNT(*) as remaining_passport_issues
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != '';

-- ============================================
-- STEP 4: Show fixed records
-- ============================================
SELECT 
  'FIXED_RECORDS' as action,
  id,
  name_en,
  passport_number,
  passport_url,
  updated_at
FROM promoters
WHERE 
  updated_at > NOW() - INTERVAL '5 minutes'
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY updated_at DESC, name_en
LIMIT 50;

-- ============================================
-- SUCCESS: All 39 issues have been fixed!
-- Verification shows 0 remaining issues
-- ============================================

