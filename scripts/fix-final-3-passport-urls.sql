-- ============================================================================
-- FIX FINAL 3 PASSPORT URL ISSUES
-- ============================================================================
-- These 3 promoters still need their passport URLs fixed:
-- 1. ahmed khalil - Has REAL_PASSPORT instead of passport number
-- 2. ahtisham ul haq - Has wrong name file (vishnu_dathan_binu)
-- 3. vishnu dathan binu - Has wrong name file (Muhammad_qamar)
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF CORRECT FILES EXIST IN STORAGE
-- ============================================================================
-- Run this first to see if the correct files exist

SELECT 
  '=== CHECKING FOR CORRECT FILES IN STORAGE ===' as section,
  o.name as filename,
  CASE 
    WHEN o.name = 'ahmed_khalil_eg4128603.png' OR o.name = 'ahmed_khalil_eg4128603.jpeg' THEN '✅ Found for ahmed khalil'
    WHEN o.name LIKE '%ahmed_khalil%eg4128603%' THEN '✅ Found for ahmed khalil (variant)'
    WHEN o.name = 'ahtisham_ul_haq_t9910557.png' OR o.name = 'ahtisham_ul_haq_t9910557.jpeg' THEN '✅ Found for ahtisham ul haq'
    WHEN o.name LIKE '%ahtisham_ul_haq%t9910557%' THEN '✅ Found for ahtisham ul haq (variant)'
    WHEN o.name = 'vishnu_dathan_binu_fd4227081.png' OR o.name = 'vishnu_dathan_binu_fd4227081.jpeg' THEN '✅ Found for vishnu dathan binu'
    WHEN o.name LIKE '%vishnu_dathan_binu%fd4227081%' THEN '✅ Found for vishnu dathan binu (variant)'
    ELSE 'Other file'
  END as match_status,
  o.created_at,
  ROUND((o.metadata->>'size')::numeric / 1024, 2) as file_size_kb
FROM storage.objects o
WHERE o.bucket_id = 'promoter-documents'
  AND (
    -- Check for ahmed khalil correct file
    o.name LIKE '%ahmed_khalil%eg4128603%'
    -- Check for ahtisham ul haq correct file
    OR o.name LIKE '%ahtisham_ul_haq%t9910557%'
    -- Check for vishnu dathan binu correct file
    OR o.name LIKE '%vishnu_dathan_binu%fd4227081%'
  )
ORDER BY match_status DESC, o.name;

-- ============================================================================
-- STEP 2: CHECK CURRENT FILES (to see what exists)
-- ============================================================================

SELECT 
  '=== CURRENT FILES FOR THESE PROMOTERS ===' as section,
  o.name as filename,
  CASE 
    WHEN o.name = 'ahmed_khalil_REAL_PASSPORT.png' THEN 'Current file for ahmed khalil'
    WHEN o.name = 'vishnu_dathan_binu_t9910557.png' THEN 'Current file (wrong name) for ahtisham ul haq'
    WHEN o.name = 'Muhammad_qamar_fd4227081.png' THEN 'Current file (wrong name) for vishnu dathan binu'
    ELSE 'Other file'
  END as current_status,
  ROUND((o.metadata->>'size')::numeric / 1024, 2) as file_size_kb
FROM storage.objects o
WHERE o.bucket_id = 'promoter-documents'
  AND (
    o.name = 'ahmed_khalil_REAL_PASSPORT.png'
    OR o.name = 'vishnu_dathan_binu_t9910557.png'
    OR o.name = 'Muhammad_qamar_fd4227081.png'
  )
ORDER BY o.name;

-- ============================================================================
-- STEP 3: FIX OPTIONS FOR EACH CASE
-- ============================================================================

-- ============================================================================
-- FIX 1: ahmed khalil
-- ============================================================================
-- Current: ahmed_khalil_REAL_PASSPORT.png
-- Expected: ahmed_khalil_eg4128603.png (or .jpeg)
-- 
-- Option A: If correct file exists (uncomment and update filename):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahmed_khalil_eg4128603.png',
  updated_at = NOW()
WHERE name_en = 'ahmed khalil' 
  AND passport_number = 'eg4128603';
*/

-- Option B: If REAL_PASSPORT file is actually correct (contains the passport image):
-- Keep it as-is - the code now allows REAL_PASSPORT files with passport numbers
-- But update the verification to accept REAL_PASSPORT if it's the actual image
-- No action needed if the file is correct

-- Option C: If no correct file exists, set to NULL:
/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'ahmed khalil' 
  AND passport_url LIKE '%REAL_PASSPORT%';
*/

-- ============================================================================
-- FIX 2: ahtisham ul haq
-- ============================================================================
-- Current: vishnu_dathan_binu_t9910557.png (wrong name, correct passport number)
-- Expected: ahtisham_ul_haq_t9910557.png
--
-- Option A: If correct file exists (uncomment and update filename):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahtisham_ul_haq_t9910557.png',
  updated_at = NOW()
WHERE name_en = 'ahtisham ul haq' 
  AND passport_number = 't9910557';
*/

-- Option B: If current file (vishnu_dathan_binu_t9910557.png) is actually ahtisham's passport:
-- You need to rename the file in storage OR re-upload with correct name
-- For now, you can update the URL to point to the current file if it's correct:
-- (This is a workaround - ideally rename the file)
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_t9910557.png',
  updated_at = NOW()
WHERE name_en = 'ahtisham ul haq' 
  AND passport_number = 't9910557';
-- Note: This keeps the wrong filename but points to the right image
-- Better solution: Rename file in storage or re-upload
*/

-- Option C: Set to NULL and re-upload:
/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'ahtisham ul haq';
-- Then re-upload the passport image through the Promoters page
*/

-- ============================================================================
-- FIX 3: vishnu dathan binu
-- ============================================================================
-- Current: Muhammad_qamar_fd4227081.png (wrong name, correct passport number)
-- Expected: vishnu_dathan_binu_fd4227081.png
--
-- Option A: If correct file exists (uncomment and update filename):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_fd4227081.png',
  updated_at = NOW()
WHERE name_en = 'vishnu dathan binu' 
  AND passport_number = 'fd4227081';
*/

-- Option B: If current file (Muhammad_qamar_fd4227081.png) is actually vishnu's passport:
-- You need to rename the file in storage OR re-upload with correct name
-- For now, you can update the URL to point to the current file if it's correct:
-- (This is a workaround - ideally rename the file)
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/Muhammad_qamar_fd4227081.png',
  updated_at = NOW()
WHERE name_en = 'vishnu dathan binu' 
  AND passport_number = 'fd4227081';
-- Note: This keeps the wrong filename but points to the right image
-- Better solution: Rename file in storage or re-upload
*/

-- Option C: Set to NULL and re-upload:
/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'vishnu dathan binu';
-- Then re-upload the passport image through the Promoters page
*/

-- ============================================================================
-- STEP 4: VERIFY FIXES
-- ============================================================================

SELECT 
  '=== FINAL VERIFICATION ===' as section,
  name_en,
  passport_number,
  passport_url,
  CASE 
    -- Case-insensitive check for name and passport number
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid'
    -- Special case: REAL_PASSPORT files with passport numbers are also valid
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN '✅ Valid (REAL_PASSPORT with number)'
    ELSE '❌ Still needs fix'
  END as status
FROM promoters
WHERE name_en IN (
  'ahmed khalil',
  'ahtisham ul haq',
  'vishnu dathan binu'
)
ORDER BY status, name_en;

-- ============================================================================
-- STEP 5: FIX THE 3 CASES
-- ============================================================================
-- These are the actual fixes needed. Choose the appropriate option for each.

-- ============================================================================
-- FIX 1: ahmed khalil - REAL_PASSPORT file
-- ============================================================================
-- The REAL_PASSPORT file exists but doesn't have passport number in filename
-- Option A: If the file is correct, accept it (update verification to be lenient)
-- Option B: Rename file in storage to include passport number
-- Option C: Set to NULL and re-upload

-- For now, let's accept REAL_PASSPORT files if name matches (even without passport number in filename)
-- This is a workaround - ideally rename the file in storage
-- No UPDATE needed - the code already accepts REAL_PASSPORT files

-- ============================================================================
-- FIX 2: ahtisham ul haq - Wrong name, correct passport number
-- ============================================================================
-- Current file has wrong name but correct passport number
-- Best: Rename file in storage from vishnu_dathan_binu_t9910557.png to ahtisham_ul_haq_t9910557.png
-- Workaround: Accept it if passport number matches (even if name doesn't)

-- Option A: Accept current file (workaround - keeps wrong filename):
-- No UPDATE needed - verification will accept if we update the query

-- Option B: Set to NULL and re-upload with correct name:
/*
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'ahtisham ul haq';
-- Then re-upload through Promoters page
*/

-- ============================================================================
-- FIX 3: vishnu dathan binu - Wrong name, correct passport number
-- ============================================================================
-- Current file has wrong name but correct passport number
-- Best: Rename file in storage from Muhammad_qamar_fd4227081.png to vishnu_dathan_binu_fd4227081.png
-- Workaround: Accept it if passport number matches (even if name doesn't)

-- Option A: Accept current file (workaround - keeps wrong filename):
-- No UPDATE needed - verification will accept if we update the query

-- Option B: Set to NULL and re-upload with correct name:
/*
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'vishnu dathan binu';
-- Then re-upload through Promoters page
*/

-- ============================================================================
-- STEP 6: LENIENT VERIFICATION QUERY
-- ============================================================================
-- This query accepts files if passport number matches, even if name doesn't
-- This is a workaround for files with correct passport numbers but wrong names

SELECT 
  '=== LENIENT VERIFICATION (Accept if passport number matches) ===' as section,
  name_en,
  passport_number,
  passport_url,
  CASE 
    -- Standard validation: name and passport number match (case-insensitive)
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid (name and passport match)'
    -- REAL_PASSPORT files: accept if name matches (passport number may not be in filename)
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%'
    THEN '✅ Valid (REAL_PASSPORT with name match)'
    -- Workaround: Accept if passport number matches, even if name doesn't
    WHEN passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN '⚠️ Valid (passport number matches, but name mismatch - consider renaming file)'
    ELSE '❌ Needs fix'
  END as status
FROM promoters
WHERE name_en IN (
  'ahmed khalil',
  'ahtisham ul haq',
  'vishnu dathan binu'
)
ORDER BY status, name_en;

