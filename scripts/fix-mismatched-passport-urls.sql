-- ============================================================================
-- FIX MISMATCHED PASSPORT URLs
-- ============================================================================
-- This script identifies the 7 potentially mismatched passport URLs
-- and provides fix statements
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY MISMATCHED PASSPORT URLs
-- ============================================================================

SELECT 
  '=== MISMATCHED PASSPORT URLs ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  -- Extract filename from URL
  SUBSTRING(
    passport_url 
    FROM 'promoter-documents/(.+)$'
  ) as filename,
  -- Check what's wrong
  CASE 
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    THEN '❌ Name mismatch in URL'
    WHEN passport_number IS NOT NULL 
         AND passport_url NOT LIKE '%' || passport_number || '%' 
    THEN '❌ Passport number mismatch'
    ELSE '⚠️ Other issue'
  END as issue_type,
  -- Suggest what the URL should contain
  CASE 
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    THEN 'Should contain: ' || LOWER(REPLACE(name_en, ' ', '_'))
    WHEN passport_number IS NOT NULL 
         AND passport_url NOT LIKE '%' || passport_number || '%' 
    THEN 'Should contain passport number: ' || passport_number
    ELSE 'Review manually'
  END as expected_content
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND (
    passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    OR (passport_number IS NOT NULL AND passport_url NOT LIKE '%' || passport_number || '%')
  )
ORDER BY 
  CASE 
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' THEN 1
    ELSE 2
  END,
  name_en;

-- ============================================================================
-- STEP 2: DETAILED ANALYSIS OF EACH MISMATCH
-- ============================================================================

SELECT 
  '=== DETAILED MISMATCH ANALYSIS ===' as section,
  id,
  name_en,
  passport_number,
  -- Normalized name for comparison
  LOWER(REPLACE(name_en, ' ', '_')) as normalized_name,
  -- Extract filename
  SUBSTRING(
    passport_url 
    FROM 'promoter-documents/(.+)$'
  ) as current_filename,
  -- What filename should be (if we know passport number)
  CASE 
    WHEN passport_number IS NOT NULL 
    THEN LOWER(REPLACE(name_en, ' ', '_')) || '_' || passport_number || '.png'
    ELSE 'Unknown - need passport number'
  END as expected_filename,
  -- Check if name appears in filename
  CASE 
    WHEN SUBSTRING(
      passport_url 
      FROM 'promoter-documents/(.+)$'
    ) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%'
    THEN '✅ Name found'
    ELSE '❌ Name NOT found'
  END as name_in_filename,
  -- Check if passport number appears in filename
  CASE 
    WHEN passport_number IS NOT NULL 
         AND SUBSTRING(
           passport_url 
           FROM 'promoter-documents/(.+)$'
         ) LIKE '%' || passport_number || '%'
    THEN '✅ Passport number found'
    WHEN passport_number IS NULL
    THEN '⚠️ No passport number in database'
    ELSE '❌ Passport number NOT found'
  END as passport_in_filename
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND (
    passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    OR (passport_number IS NOT NULL AND passport_url NOT LIKE '%' || passport_number || '%')
  )
ORDER BY name_en;

-- ============================================================================
-- STEP 3: CHECK FOR CORRECT FILES IN STORAGE
-- ============================================================================
-- This helps identify if the correct file exists for these promoters
-- Run this in Supabase SQL Editor to check storage.objects

/*
SELECT 
  '=== CHECKING STORAGE FOR CORRECT FILES ===' as section,
  p.name_en,
  p.passport_number,
  o.name as storage_filename,
  CASE 
    WHEN o.name LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%'
         AND (p.passport_number IS NULL OR o.name LIKE '%' || p.passport_number || '%')
    THEN '✅ MATCH - This is the correct file'
    ELSE '❌ Not a match'
  END as match_status
FROM promoters p
CROSS JOIN storage.objects o
WHERE o.bucket_id = 'promoter-documents'
  AND p.passport_url IS NOT NULL 
  AND p.passport_url NOT LIKE '%NO_PASSPORT%'
  AND (
    p.passport_url NOT LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%' 
    OR (p.passport_number IS NOT NULL AND p.passport_url NOT LIKE '%' || p.passport_number || '%')
  )
  AND (
    o.name LIKE '%' || LOWER(REPLACE(p.name_en, ' ', '_')) || '%'
    OR (p.passport_number IS NOT NULL AND o.name LIKE '%' || p.passport_number || '%')
  )
ORDER BY p.name_en, match_status DESC;
*/

-- ============================================================================
-- STEP 4: GENERATE FIX STATEMENTS (MANUAL REVIEW REQUIRED)
-- ============================================================================
-- ⚠️ REVIEW EACH CASE MANUALLY BEFORE EXECUTING ⚠️
-- These are template UPDATE statements - modify the URLs based on your findings

/*
-- Example fix template (modify with correct URL):
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[CORRECT_FILENAME]',
  updated_at = NOW()
WHERE id = '[promoter_id]'
  AND name_en = '[promoter_name]';

-- Example: If you find the correct file for a promoter:
-- UPDATE promoters
-- SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/correct_filename.png',
--     updated_at = NOW()
-- WHERE name_en = 'promoter name';
*/

-- ============================================================================
-- STEP 5: LIST ALL FILES IN STORAGE FOR MANUAL MATCHING
-- ============================================================================
-- This helps you manually find the correct files
-- Run this to see all passport-related files in storage

/*
SELECT 
  '=== ALL PASSPORT FILES IN STORAGE ===' as section,
  name as filename,
  created_at,
  metadata->>'size' as file_size_bytes,
  ROUND((metadata->>'size')::numeric / 1024, 2) as file_size_kb
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
  AND (
    name LIKE '%passport%' 
    OR name LIKE '%PASSPORT%'
    OR name ~ '[a-z_]+_[a-z]{1,2}\d{7,}\.(png|jpeg|jpg)'  -- Pattern: name_passportnumber.ext
  )
ORDER BY name;
*/

