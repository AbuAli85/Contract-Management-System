-- ============================================================================
-- VERIFY VALID PASSPORT URLs
-- ============================================================================
-- This script verifies that the 32 valid passport URLs are correct
-- Checks for name/passport number matches and potential issues
-- ============================================================================

-- ============================================================================
-- STEP 1: LIST ALL VALID PASSPORT URLs
-- ============================================================================

SELECT 
  '=== ALL VALID PASSPORT URLs ===' as section,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    -- Check if URL contains promoter name (normalized)
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
    THEN '✅ Name matches'
    ELSE '⚠️ Name may not match'
  END as name_match,
  CASE 
    -- Check if URL contains passport number
    WHEN passport_number IS NOT NULL 
         AND passport_url LIKE '%' || passport_number || '%' 
    THEN '✅ Passport number matches'
    WHEN passport_number IS NULL 
    THEN '⚠️ No passport number in database'
    ELSE '⚠️ Passport number may not match'
  END as passport_match,
  CASE 
    -- Standard validation: name and passport number match (case-insensitive)
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid'
    -- REAL_PASSPORT files: if they contain the passport number, they're valid
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN '✅ Valid (REAL_PASSPORT with passport number)'
    ELSE '⚠️ Review needed'
  END as overall_status
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY 
  CASE 
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR passport_url LIKE '%' || passport_number || '%')
    THEN 1
    ELSE 2
  END,
  name_en;

-- ============================================================================
-- STEP 2: IDENTIFY POTENTIALLY MISMATCHED URLs
-- ============================================================================

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
-- STEP 3: EXTRACT FILENAMES FOR MANUAL VERIFICATION
-- ============================================================================

SELECT 
  '=== PASSPORT IMAGE FILENAMES FOR VERIFICATION ===' as section,
  name_en,
  passport_number,
  -- Extract filename from URL
  SUBSTRING(
    passport_url 
    FROM 'promoter-documents/(.+)$'
  ) as filename,
  passport_url as full_url
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY name_en;

-- ============================================================================
-- STEP 4: STATISTICS SUMMARY
-- ============================================================================

SELECT 
  '=== VALID PASSPORT URL STATISTICS ===' as section,
  COUNT(*) as total_valid_urls,
  COUNT(CASE 
    -- Standard validation: name and passport number match (case-insensitive)
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN 1 
    -- REAL_PASSPORT files: if they contain the passport number, they're valid
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN 1
  END) as fully_matched_urls,
  COUNT(CASE 
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         OR (passport_number IS NOT NULL AND passport_url NOT LIKE '%' || passport_number || '%')
    THEN 1 
  END) as potentially_mismatched_urls
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%';

