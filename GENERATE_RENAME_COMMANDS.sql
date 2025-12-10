-- Generate Rename Commands for Storage Files
-- This script generates the mapping of old filenames to new filenames
-- Use this output to rename files in Supabase Storage Dashboard

-- ============================================
-- Generate Rename Mapping
-- ============================================
SELECT 
  'RENAME_COMMAND' as action,
  id,
  name_en,
  passport_number,
  -- Old filename (what exists in storage)
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png' as old_filename,
  -- New filename (what database expects)
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || '.png' as new_filename,
  -- Full URLs
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png' as old_url,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || '.png' as new_url
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND passport_url LIKE '%promoter-documents%'
ORDER BY name_en;

-- ============================================
-- Summary: Count files that need renaming
-- ============================================
SELECT 
  'SUMMARY' as report_type,
  COUNT(*) as files_to_rename
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND passport_url LIKE '%promoter-documents%';

