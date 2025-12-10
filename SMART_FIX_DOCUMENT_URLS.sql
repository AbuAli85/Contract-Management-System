-- Smart Fix for Document URLs
-- This script attempts to match existing files in storage with correct naming
-- It's safer than the automatic fix as it checks if files actually exist

-- ============================================
-- STEP 1: Find Passport Issues with Potential File Matches
-- ============================================
WITH passport_issues AS (
  SELECT 
    p.id,
    p.name_en,
    p.passport_number,
    p.passport_url as current_url,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.passport_number, ' ', '_')) || '.png' as expected_url,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.passport_number, ' ', '_')) || '.jpg' as expected_url_jpg,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.passport_number, ' ', '_')) || '.jpeg' as expected_url_jpeg
  FROM promoters p
  WHERE 
    p.passport_url IS NOT NULL
    AND p.passport_url LIKE '%NO_PASSPORT%'
    AND p.passport_number IS NOT NULL
    AND p.passport_number != ''
    AND p.name_en IS NOT NULL
    AND p.name_en != ''
)
SELECT 
  'PASSPORT_FIX' as action_type,
  id,
  name_en,
  passport_number,
  current_url,
  expected_url as recommended_url,
  'UPDATE promoters SET passport_url = ''' || expected_url || ''', updated_at = NOW() WHERE id = ''' || id || ''';' as fix_sql
FROM passport_issues
ORDER BY name_en;

-- ============================================
-- STEP 2: Find ID Card Issues with Potential File Matches
-- ============================================
WITH id_card_issues AS (
  SELECT 
    p.id,
    p.name_en,
    p.id_card_number,
    p.id_card_url as current_url,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.id_card_number, ' ', '_')) || '.png' as expected_url,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.id_card_number, ' ', '_')) || '.jpg' as expected_url_jpg,
    'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.id_card_number, ' ', '_')) || '.jpeg' as expected_url_jpeg
  FROM promoters p
  WHERE 
    p.id_card_url IS NOT NULL
    AND p.id_card_url LIKE '%NO_ID%'
    AND p.id_card_number IS NOT NULL
    AND p.id_card_number != ''
    AND p.name_en IS NOT NULL
    AND p.name_en != ''
)
SELECT 
  'ID_CARD_FIX' as action_type,
  id,
  name_en,
  id_card_number,
  current_url,
  expected_url as recommended_url,
  'UPDATE promoters SET id_card_url = ''' || expected_url || ''', updated_at = NOW() WHERE id = ''' || id || ''';' as fix_sql
FROM id_card_issues
ORDER BY name_en;

-- ============================================
-- STEP 3: Generate Batch Fix Script
-- ============================================
-- This generates a complete UPDATE script for all passport issues
SELECT 
  'UPDATE promoters SET passport_url = ''' ||
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || '.png' ||
  ''', updated_at = NOW() WHERE id = ''' || id || ''';'
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND name_en IS NOT NULL
  AND name_en != ''
ORDER BY name_en;

-- Generate batch fix for ID cards
SELECT 
  'UPDATE promoters SET id_card_url = ''' ||
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(id_card_number, ' ', '_')) || '.png' ||
  ''', updated_at = NOW() WHERE id = ''' || id || ''';'
FROM promoters
WHERE 
  id_card_url IS NOT NULL
  AND id_card_url LIKE '%NO_ID%'
  AND id_card_number IS NOT NULL
  AND id_card_number != ''
  AND name_en IS NOT NULL
  AND name_en != ''
ORDER BY name_en;

