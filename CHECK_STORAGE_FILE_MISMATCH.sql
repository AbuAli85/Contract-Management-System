-- Check for Storage File Mismatch
-- This script identifies promoters where database URLs don't match actual storage files
-- Database URLs were updated, but storage files may still have old names

-- ============================================
-- STEP 1: Find promoters with updated URLs but old storage files
-- ============================================
SELECT 
  'STORAGE_MISMATCH' as issue_type,
  id,
  name_en,
  passport_number,
  passport_url,
  -- Extract filename from URL
  SUBSTRING(passport_url FROM 'promoter-documents/(.*)$') as current_filename,
  -- Expected filename based on passport number
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || '.png' as expected_filename,
  -- Old filename that might still exist
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png' as old_filename
FROM promoters
WHERE 
  passport_url IS NOT NULL
  AND passport_number IS NOT NULL
  AND passport_number != ''
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND passport_url LIKE '%promoter-documents%'
ORDER BY name_en;

-- ============================================
-- STEP 2: List all NO_PASSPORT files that might need renaming
-- ============================================
-- Note: This requires access to storage.objects table
-- Run this in Supabase SQL Editor with proper permissions

SELECT 
  'OLD_FILES_IN_STORAGE' as file_type,
  name as filename,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || name as full_url
FROM storage.objects
WHERE 
  bucket_id = 'promoter-documents'
  AND name LIKE '%_NO_PASSPORT%'
ORDER BY name;

-- ============================================
-- STEP 3: Match old files with promoters
-- ============================================
SELECT 
  'MATCH_OLD_FILES' as action,
  p.id,
  p.name_en,
  p.passport_number,
  o.name as old_storage_filename,
  LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(p.passport_number, ' ', '_')) || '.png' as new_storage_filename,
  p.passport_url as current_database_url
FROM promoters p
JOIN storage.objects o ON o.bucket_id = 'promoter-documents'
  AND o.name = LOWER(REPLACE(REPLACE(p.name_en, ' ', '_'), '-', '_')) || '_NO_PASSPORT.png'
WHERE 
  p.passport_number IS NOT NULL
  AND p.passport_number != ''
  AND p.passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY p.name_en;

