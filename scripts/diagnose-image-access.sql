-- ============================================================================
-- COMPREHENSIVE IMAGE ACCESS DIAGNOSTICS
-- ============================================================================
-- This script checks all aspects of image accessibility for Google Docs API
-- ============================================================================

-- Step 1: Check bucket public status
SELECT 
  '=== STEP 1: BUCKET PUBLIC STATUS ===' as section,
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN public = true THEN '✅ Bucket is PUBLIC'
    ELSE '❌ Bucket is PRIVATE - needs to be public!'
  END as status
FROM storage.buckets
WHERE id = 'promoter-documents';

-- Step 2: Check RLS policies for SELECT operations
SELECT 
  '=== STEP 2: SELECT (READ) POLICIES ===' as section,
  policyname,
  roles,
  cmd,
  qual,
  CASE 
    WHEN roles = '{public}' AND qual = '(bucket_id = ''promoter-documents''::text)' 
      THEN '✅ PUBLIC READ - This is what we need!'
    WHEN roles = '{authenticated}' 
      THEN '⚠️ AUTHENTICATED ONLY - Blocks Google Docs API'
    WHEN qual LIKE '%auth.role()%authenticated%' 
      THEN '⚠️ REQUIRES AUTH - Blocks Google Docs API'
    ELSE '🔐 CONDITIONAL ACCESS'
  END as analysis
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND cmd = 'SELECT'
  AND (policyname LIKE '%promoter-documents%' OR qual LIKE '%promoter-documents%')
ORDER BY policyname;

-- Step 3: Check actual image files in storage
SELECT 
  '=== STEP 3: FILES IN STORAGE ===' as section,
  name as filename,
  bucket_id,
  metadata->>'size' as file_size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at,
  CASE 
    WHEN (metadata->>'size')::int > 5242880 THEN '❌ TOO LARGE (>5MB)'
    WHEN metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/jpg') THEN '⚠️ UNSUPPORTED FORMAT'
    ELSE '✅ SIZE & FORMAT OK'
  END as file_status
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Check promoter URLs in database
SELECT 
  '=== STEP 4: PROMOTER IMAGE URLS ===' as section,
  id,
  name_en,
  id_card_url,
  passport_url,
  CASE 
    WHEN id_card_url LIKE 'https://%' THEN '✅ ID Card URL is FULL'
    WHEN id_card_url IS NOT NULL THEN '❌ ID Card URL is PARTIAL'
    ELSE '⚠️ ID Card URL is MISSING'
  END as id_card_status,
  CASE 
    WHEN passport_url LIKE 'https://%' THEN '✅ Passport URL is FULL'
    WHEN passport_url IS NOT NULL THEN '❌ Passport URL is PARTIAL'
    ELSE '⚠️ Passport URL is MISSING'
  END as passport_status
FROM promoters
WHERE id_card_url IS NOT NULL OR passport_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Generate test URLs for the specific promoter
SELECT 
  '=== STEP 5: TEST URLS FOR YOUR PROMOTER ===' as section,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.id_card_url as db_id_card_url,
  p.passport_url as db_passport_url,
  -- Generate what the URL SHOULD be
  CASE 
    WHEN p.id_card_url IS NOT NULL THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
      CASE 
        WHEN p.id_card_url LIKE 'https://%' THEN regexp_replace(p.id_card_url, '^.*promoter-documents/', '')
        ELSE p.id_card_url
      END
    ELSE NULL
  END as correct_id_card_url,
  CASE 
    WHEN p.passport_url IS NOT NULL THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
      CASE 
        WHEN p.passport_url LIKE 'https://%' THEN regexp_replace(p.passport_url, '^.*promoter-documents/', '')
        ELSE p.passport_url
      END
    ELSE NULL
  END as correct_passport_url
FROM promoters p
WHERE p.id = '6badb25a-1403-4eb2-88f5-06d978891f3e'; -- Your specific promoter

-- Step 6: Verify file actually exists for this promoter
SELECT 
  '=== STEP 6: FILE EXISTENCE CHECK ===' as section,
  p.name_en as promoter_name,
  p.id_card_number,
  p.passport_number,
  -- Check if files exist in storage matching this promoter
  (SELECT COUNT(*) FROM storage.objects 
   WHERE bucket_id = 'promoter-documents' 
   AND name LIKE '%' || COALESCE(p.id_card_number, 'NONE') || '%') as id_card_files_found,
  (SELECT COUNT(*) FROM storage.objects 
   WHERE bucket_id = 'promoter-documents' 
   AND name LIKE '%' || COALESCE(p.passport_number, 'NONE') || '%') as passport_files_found,
  -- Show the actual filenames if found
  (SELECT name FROM storage.objects 
   WHERE bucket_id = 'promoter-documents' 
   AND name LIKE '%' || COALESCE(p.id_card_number, 'NONE') || '%' 
   LIMIT 1) as id_card_filename,
  (SELECT name FROM storage.objects 
   WHERE bucket_id = 'promoter-documents' 
   AND name LIKE '%' || COALESCE(p.passport_number, 'NONE') || '%' 
   LIMIT 1) as passport_filename
FROM promoters p
WHERE p.id = '6badb25a-1403-4eb2-88f5-06d978891f3e';

-- Step 7: Final checklist
SELECT 
  '=== STEP 7: FINAL CHECKLIST ===' as section,
  'Bucket Public' as check_item,
  CASE WHEN (SELECT public FROM storage.buckets WHERE id = 'promoter-documents') = true 
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
  '=== STEP 7: FINAL CHECKLIST ===',
  'Public Read Policy Exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for promoter-documents'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  '=== STEP 7: FINAL CHECKLIST ===',
  'Promoter Has Image URLs',
  CASE WHEN EXISTS (
    SELECT 1 FROM promoters 
    WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e'
    AND (id_card_url IS NOT NULL OR passport_url IS NOT NULL)
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  '=== STEP 7: FINAL CHECKLIST ===',
  'URLs are Full HTTPS',
  CASE WHEN (
    SELECT COUNT(*) FROM promoters 
    WHERE id = '6badb25a-1403-4eb2-88f5-06d978891f3e'
    AND (id_card_url LIKE 'https://%' OR passport_url LIKE 'https://%')
  ) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  '=== STEP 7: FINAL CHECKLIST ===',
  'Files Exist in Storage',
  CASE WHEN (
    SELECT COUNT(*) FROM storage.objects 
    WHERE bucket_id = 'promoter-documents'
  ) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END;

-- ============================================================================
-- 🧪 MANUAL TESTING INSTRUCTIONS
-- ============================================================================
-- After running this script:
-- 
-- 1. Copy one of the "correct_*_url" values from Step 5
-- 2. Open an INCOGNITO/PRIVATE browser window
-- 3. Paste the URL and press Enter
-- 4. If you see the image WITHOUT login prompt = SUCCESS ✅
-- 5. If you get "403 Forbidden" or login prompt = FAILURE ❌
-- 
-- If test fails, the issue is NOT with Make.com but with Supabase setup.
-- If test succeeds, the issue is with the URL being sent to Make.com Module 6.
-- ============================================================================

