-- Find ALL Remaining NO_PASSPORT Files
-- This script finds all promoters and storage files that still have NO_PASSPORT

-- ============================================
-- STEP 1: Find promoters with NO_PASSPORT in database URLs
-- ============================================
SELECT 
  'DATABASE_URL_ISSUE' as issue_type,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_number IS NOT NULL AND passport_number != '' THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(passport_number, ' ', '_')) || 
      CASE 
        WHEN passport_url LIKE '%.jpeg' THEN '.jpeg'
        WHEN passport_url LIKE '%.jpg' THEN '.jpg'
        ELSE '.png'
      END
    ELSE NULL
  END as correct_url
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_url LIKE '%NO_PASSPORT%'
  AND passport_number IS NOT NULL
  AND passport_number != ''
ORDER BY name_en;

-- ============================================
-- STEP 2: Find all NO_PASSPORT files in storage
-- ============================================
SELECT 
  'STORAGE_FILE' as issue_type,
  name as filename,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || name as full_url
FROM storage.objects
WHERE 
  bucket_id = 'promoter-documents'
  AND (
    name ILIKE '%NO_PASSPORT%'
    OR name ILIKE '%no_passport%'
  )
ORDER BY name;

-- ============================================
-- STEP 3: Match storage files with promoters
-- ============================================
SELECT 
  'MATCH' as action,
  p.id,
  p.name_en,
  p.passport_number,
  o.name as storage_filename,
  CASE 
    WHEN p.passport_number IS NOT NULL AND p.passport_number != '' THEN
      LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(p.passport_number, ' ', '_')) || 
      CASE 
        WHEN o.name LIKE '%.jpeg' THEN '.jpeg'
        WHEN o.name LIKE '%.jpg' THEN '.jpg'
        ELSE '.png'
      END
    ELSE NULL
  END as expected_filename,
  p.passport_url as current_database_url
FROM promoters p
JOIN storage.objects o ON o.bucket_id = 'promoter-documents'
  AND (
    o.name = LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png'
    OR o.name = LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.jpeg'
    OR o.name = LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.jpg'
    OR o.name = UPPER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png'
    OR o.name = UPPER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.jpeg'
  )
WHERE 
  p.passport_number IS NOT NULL
  AND p.passport_number != ''
ORDER BY p.name_en;

-- ============================================
-- STEP 4: Summary count
-- ============================================
SELECT 
  'SUMMARY' as report_type,
  COUNT(DISTINCT p.id) FILTER (WHERE p.passport_url LIKE '%NO_PASSPORT%' AND p.passport_number IS NOT NULL) as db_url_issues,
  COUNT(DISTINCT o.name) FILTER (WHERE o.name ILIKE '%NO_PASSPORT%') as storage_file_issues
FROM promoters p
CROSS JOIN storage.objects o
WHERE o.bucket_id = 'promoter-documents';

