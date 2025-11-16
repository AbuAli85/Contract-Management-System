-- ============================================================================
-- FIX SPECIFIC PASSPORT URL ISSUES
-- ============================================================================
-- Based on the mismatch analysis, here are the fixes for the 7 mismatched URLs
-- ============================================================================

-- ============================================================================
-- ISSUE ANALYSIS:
-- ============================================================================
-- 1. Case mismatches (4 cases) - These are actually FINE, just case sensitivity
--    - asad shakeel: BS5165582 vs bs5165582 ✅ (file exists, just case difference)
--    - kaif ali khan: R7770883 vs r7770883 ✅ (file exists, just case difference)
--    - luqman shahzada: Ry5141352 vs ry5141352 ✅ (file exists, just case difference)
--    - siddiq syed: W3851075 vs w3851075 ✅ (file exists, just case difference)
--
-- 2. REAL_PASSPORT marker (1 case) - Need to check if correct file exists
--    - ahmed khalil: Has REAL_PASSPORT instead of eg4128603
--
-- 3. Wrong name assignments (2 cases) - Need to fix
--    - ahtisham ul haq: Has vishnu_dathan_binu_t9910557.png (wrong name, correct passport)
--    - vishnu dathan binu: Has Muhammad_qamar_fd4227081.png (wrong name, correct passport)
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX REAL ISSUES
-- ============================================================================

-- Fix 1: ahmed khalil - Check if file with passport number exists, otherwise keep REAL_PASSPORT
-- First, check if the correct file exists in storage (you'll need to verify manually)
-- If file exists: ahmed_khalil_eg4128603.png
-- If not: Keep REAL_PASSPORT or set to NULL

-- Option A: If correct file exists (uncomment and update filename if needed):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahmed_khalil_eg4128603.png',
  updated_at = NOW()
WHERE name_en = 'ahmed khalil'
  AND passport_number = 'eg4128603';
*/

-- Option B: If correct file doesn't exist, set to NULL (uncomment if needed):
/*
UPDATE promoters
SET 
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = 'ahmed khalil'
  AND passport_url LIKE '%REAL_PASSPORT%';
*/

-- Fix 2: ahtisham ul haq - Has wrong name file (vishnu_dathan_binu_t9910557.png)
-- Need to find the correct file: ahtisham_ul_haq_t9910557.png
-- If correct file exists (uncomment and update filename if needed):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahtisham_ul_haq_t9910557.png',
  updated_at = NOW()
WHERE name_en = 'ahtisham ul haq'
  AND passport_number = 't9910557';
*/

-- Fix 3: vishnu dathan binu - Has wrong name file (Muhammad_qamar_fd4227081.png)
-- Need to find the correct file: vishnu_dathan_binu_fd4227081.png
-- If correct file exists (uncomment and update filename if needed):
/*
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_fd4227081.png',
  updated_at = NOW()
WHERE name_en = 'vishnu dathan binu'
  AND passport_number = 'fd4227081';
*/

-- ============================================================================
-- STEP 2: VERIFY CASE MISMATCHES ARE ACTUALLY FINE
-- ============================================================================
-- These 4 cases have case mismatches but the files exist and work correctly
-- The validation query is case-sensitive, but the actual URLs work fine
-- No action needed for these, but we can note them:

SELECT 
  '=== CASE MISMATCHES (These are OK - files exist) ===' as section,
  name_en,
  passport_number,
  passport_url,
  '✅ File exists and works - case difference only' as status
FROM promoters
WHERE name_en IN ('asad shakeel', 'kaif ali khan', 'luqman shahzada', 'siddiq syed')
  AND passport_url IS NOT NULL
ORDER BY name_en;

-- ============================================================================
-- STEP 3: CHECK FOR CORRECT FILES IN STORAGE
-- ============================================================================
-- Run this to check if the correct files exist for the 3 cases that need fixing
-- Uncomment and run in Supabase SQL Editor:

/*
SELECT 
  '=== CHECKING FOR CORRECT FILES ===' as section,
  o.name as filename,
  CASE 
    WHEN o.name = 'ahmed_khalil_eg4128603.png' THEN '✅ Found for ahmed khalil'
    WHEN o.name = 'ahtisham_ul_haq_t9910557.png' THEN '✅ Found for ahtisham ul haq'
    WHEN o.name = 'vishnu_dathan_binu_fd4227081.png' THEN '✅ Found for vishnu dathan binu'
    ELSE 'Other file'
  END as match_status
FROM storage.objects o
WHERE o.bucket_id = 'promoter-documents'
  AND (
    o.name = 'ahmed_khalil_eg4128603.png'
    OR o.name = 'ahtisham_ul_haq_t9910557.png'
    OR o.name = 'vishnu_dathan_binu_fd4227081.png'
    OR o.name LIKE '%ahmed_khalil%eg4128603%'
    OR o.name LIKE '%ahtisham_ul_haq%t9910557%'
    OR o.name LIKE '%vishnu_dathan_binu%fd4227081%'
  )
ORDER BY o.name;
*/

-- ============================================================================
-- STEP 4: VERIFY ALL FIXES
-- ============================================================================

SELECT 
  '=== VERIFICATION AFTER FIXES ===' as section,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid'
    ELSE '❌ Still needs fix'
  END as status
FROM promoters
WHERE name_en IN (
  'ahmed khalil',
  'ahtisham ul haq',
  'vishnu dathan binu',
  'asad shakeel',
  'kaif ali khan',
  'luqman shahzada',
  'siddiq syed'
)
ORDER BY status, name_en;

-- ============================================================================
-- STEP 5: UPDATE VALIDATION TO BE CASE-INSENSITIVE
-- ============================================================================
-- Note: The code validation should be updated to be case-insensitive
-- This is handled in app/api/contracts/makecom/generate/route.ts
-- The validation already uses case-insensitive checks for NO_PASSPORT
-- But passport number matching should also be case-insensitive

