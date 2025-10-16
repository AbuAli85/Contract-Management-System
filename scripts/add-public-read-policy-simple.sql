-- ============================================================================
-- SIMPLE: Add Public Read Policy (No Drops, No Deadlocks)
-- ============================================================================
-- This script safely adds a public read policy without dropping anything
-- ============================================================================

-- Step 1: Check if the policy already exists
SELECT 
  '=== STEP 1: Check if public read policy exists ===' as section,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Policy exists' ELSE '❌ Policy missing' END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'promoter-documents-public-select';

-- Step 2: Create the policy (will fail silently if it exists)
DO $$ 
BEGIN
  -- Try to create the policy
  CREATE POLICY "promoter-documents-public-select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'promoter-documents');
  
  RAISE NOTICE '✅ Public read policy created successfully';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ Policy already exists, skipping...';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- Step 3: Verify the policy exists and is correct
SELECT 
  '=== STEP 3: Verify public read policy ===' as section,
  policyname,
  cmd as operation,
  roles,
  qual as condition,
  CASE 
    WHEN roles = '{public}' AND cmd = 'SELECT' THEN '✅ PUBLIC READ - Perfect!'
    ELSE '⚠️ Check configuration'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'promoter-documents-public-select';

-- Step 4: Verify bucket is public
SELECT 
  '=== STEP 4: Verify bucket ===' as section,
  id,
  name,
  public,
  CASE WHEN public = true THEN '✅ Bucket is PUBLIC' ELSE '❌ Bucket is PRIVATE' END as status
FROM storage.buckets
WHERE id = 'promoter-documents';

-- ============================================================================
-- 🧪 IMMEDIATE TEST:
-- ============================================================================
-- Open incognito browser and visit:
-- https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
--
-- Expected: Image displays without login
-- ============================================================================

