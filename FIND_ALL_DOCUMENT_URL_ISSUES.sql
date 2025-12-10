-- Find All Promoters with Document URL Issues
-- This script identifies promoters where document URLs contain "NO_PASSPORT" or "NO_ID"
-- when the actual document numbers exist in the database

-- ============================================
-- ISSUE 1: Passport URLs with NO_PASSPORT when passport_number exists
-- ============================================
SELECT 
  'PASSPORT_URL_ISSUE' as issue_type,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_number IS NOT NULL AND passport_number != '' THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(passport_number, ' ', '_')) || '.png'
    ELSE NULL
  END as correct_url,
  'UPDATE promoters SET passport_url = ''' ||
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || '.png' ||
  ''', updated_at = NOW() WHERE id = ''' || id || ''';' as fix_sql
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != ''
ORDER BY name_en;

-- ============================================
-- ISSUE 2: ID Card URLs with NO_ID when id_card_number exists
-- ============================================
SELECT 
  'ID_CARD_URL_ISSUE' as issue_type,
  id,
  name_en,
  id_card_number,
  id_card_url,
  CASE 
    WHEN id_card_number IS NOT NULL AND id_card_number != '' THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(id_card_number, ' ', '_')) || '.png'
    ELSE NULL
  END as correct_url,
  'UPDATE promoters SET id_card_url = ''' ||
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(id_card_number, ' ', '_')) || '.png' ||
  ''', updated_at = NOW() WHERE id = ''' || id || ''';' as fix_sql
FROM promoters
WHERE 
  id_card_url IS NOT NULL
  AND id_card_url LIKE '%NO_ID%'
  AND id_card_number IS NOT NULL
  AND id_card_number != ''
ORDER BY name_en;

-- ============================================
-- SUMMARY: Count of issues
-- ============================================
SELECT 
  'SUMMARY' as report_type,
  COUNT(*) FILTER (WHERE passport_url LIKE '%NO_PASSPORT%' AND passport_number IS NOT NULL AND passport_number != '') as passport_issues,
  COUNT(*) FILTER (WHERE id_card_url LIKE '%NO_ID%' AND id_card_number IS NOT NULL AND id_card_number != '') as id_card_issues,
  COUNT(*) FILTER (WHERE passport_url LIKE '%NO_PASSPORT%' AND passport_number IS NOT NULL AND passport_number != '') +
  COUNT(*) FILTER (WHERE id_card_url LIKE '%NO_ID%' AND id_card_number IS NOT NULL AND id_card_number != '') as total_issues
FROM promoters;

