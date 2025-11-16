-- ============================================================================
-- PASSPORT URL ANALYSIS AND FIX SCRIPT
-- ============================================================================
-- This script helps identify and fix broken passport image URLs
-- Based on the data provided, many promoters have NO_PASSPORT placeholders
-- ============================================================================

-- ============================================================================
-- STEP 1: ANALYZE CURRENT PASSPORT URL STATUS
-- ============================================================================

SELECT 
  '=== PASSPORT URL ANALYSIS ===' as section,
  COUNT(*) as total_promoters,
  COUNT(passport_url) as promoters_with_passport_url,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as no_passport_placeholders,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' = FALSE AND passport_url IS NOT NULL THEN 1 END) as real_passport_images,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as missing_passport_urls
FROM promoters;

-- ============================================================================
-- STEP 2: LIST ALL PROMOTERS WITH NO_PASSPORT PLACEHOLDERS
-- ============================================================================

SELECT 
  '=== PROMOTERS WITH NO_PASSPORT PLACEHOLDERS ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  'NO_PASSPORT placeholder - will be filtered out' as status
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 3: LIST PROMOTERS WITH REAL PASSPORT IMAGES
-- ============================================================================

SELECT 
  '=== PROMOTERS WITH REAL PASSPORT IMAGES ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND passport_url LIKE '%' || passport_number || '%' 
    THEN '✅ URL matches name and passport number'
    WHEN passport_url LIKE '%' || passport_number || '%' 
    THEN '⚠️ URL contains passport number but name mismatch possible'
    ELSE '❌ URL may not match promoter'
  END as url_validation
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 4: IDENTIFY MISMATCHED PASSPORT URLs
-- ============================================================================
-- Check for cases where passport URL doesn't match the promoter's name or passport number

SELECT 
  '=== POTENTIALLY MISMATCHED PASSPORT URLs ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    THEN 'Name mismatch in URL'
    WHEN passport_number IS NOT NULL 
         AND passport_url NOT LIKE '%' || passport_number || '%' 
    THEN 'Passport number mismatch'
    ELSE 'Other issue'
  END as issue_type
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
  AND (
    passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    OR (passport_number IS NOT NULL AND passport_url NOT LIKE '%' || passport_number || '%')
  )
ORDER BY name_en;

-- ============================================================================
-- STEP 5: FIND PROMOTERS WITH PASSPORT NUMBERS BUT NO IMAGE
-- ============================================================================

SELECT 
  '=== PROMOTERS WITH PASSPORT NUMBER BUT NO IMAGE ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  'Has passport number but URL is NULL or placeholder' as status
FROM promoters
WHERE passport_number IS NOT NULL 
  AND passport_number != ''
  AND (passport_url IS NULL OR passport_url LIKE '%NO_PASSPORT%')
ORDER BY name_en;

-- ============================================================================
-- STEP 6: GENERATE FIX STATEMENTS FOR NO_PASSPORT PLACEHOLDERS
-- ============================================================================
-- Set passport_url to NULL for promoters with NO_PASSPORT placeholders
-- This will prevent them from being included in contract generation

SELECT 
  '=== FIX STATEMENTS: SET NO_PASSPORT TO NULL ===' as section,
  'UPDATE promoters SET passport_url = NULL WHERE id = ''' || id || ''';' as fix_statement,
  name_en,
  passport_url
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 7: VERIFY IMAGE FILE NAMES IN STORAGE
-- ============================================================================
-- This query helps identify what passport image files actually exist
-- Run this in Supabase SQL Editor to check storage.objects

/*
SELECT 
  '=== PASSPORT FILES IN STORAGE ===' as section,
  name as filename,
  created_at,
  updated_at,
  metadata->>'size' as file_size
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
  AND (name LIKE '%passport%' OR name LIKE '%PASSPORT%' OR name LIKE '%_NO_PASSPORT%')
ORDER BY name;
*/

-- ============================================================================
-- STEP 8: SUGGESTED FIXES FOR SPECIFIC CASES
-- ============================================================================

-- Fix 1: Set NO_PASSPORT placeholders to NULL (so they're properly filtered)
-- UNCOMMENT TO RUN:
/*
UPDATE promoters
SET passport_url = NULL
WHERE passport_url LIKE '%NO_PASSPORT%';
*/

-- Fix 2: Fix mismatched passport URLs (example for specific cases)
-- UNCOMMENT AND MODIFY AS NEEDED:
/*
-- Example: Fix "vishnu dathan binu" who has "Muhammad_qamar_fd4227081.png"
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_t9910557.png'
WHERE name_en = 'vishnu dathan binu'
  AND passport_number = 't9910557';

-- Example: Fix "ahtisham ul haq" who has "vishnu_dathan_binu_t9910557.png"
-- First, find the correct file for "ahtisham ul haq"
-- UPDATE promoters
-- SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[correct_filename]'
-- WHERE name_en = 'ahtisham ul haq';
*/

-- ============================================================================
-- STEP 9: VERIFICATION QUERY AFTER FIXES
-- ============================================================================

SELECT 
  '=== VERIFICATION: FINAL STATUS ===' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN 1 END) as valid_passport_urls,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as null_passport_urls,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as remaining_placeholders
FROM promoters;

