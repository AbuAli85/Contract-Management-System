-- ============================================================================
-- RESET STORAGE RLS POLICIES - KEEP ONLY ESSENTIALS
-- ============================================================================
-- This script drops all existing RLS policies on storage.objects and creates
-- simple, permissive policies that will definitely allow public access
-- ============================================================================

-- Step 1: Show existing policies
SELECT 
  '=== STEP 1: EXISTING POLICIES (BEFORE) ===' as section,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN roles = '{public}' AND qual NOT LIKE '%auth%' THEN '🌍 Public'
    WHEN qual LIKE '%auth.role()%' THEN '🔒 Requires Auth'
    ELSE '🔐 Conditional'
  END as access_type
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%promoter-documents%' OR qual LIKE '%promoter-documents%')
ORDER BY cmd, policyname;

-- Step 2: Drop ALL existing policies for promoter-documents
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND (policyname LIKE '%promoter-documents%' OR qual LIKE '%promoter-documents%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Create SIMPLE, PERMISSIVE policies
-- These policies are designed to be as permissive as possible

-- PUBLIC READ for everyone
CREATE POLICY "promoter-documents-public-select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'promoter-documents');

-- AUTHENTICATED users can INSERT
CREATE POLICY "promoter-documents-authenticated-insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'promoter-documents');

-- AUTHENTICATED users can UPDATE
CREATE POLICY "promoter-documents-authenticated-update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'promoter-documents')
  WITH CHECK (bucket_id = 'promoter-documents');

-- AUTHENTICATED users can DELETE
CREATE POLICY "promoter-documents-authenticated-delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'promoter-documents');

-- SERVICE ROLE has full access
CREATE POLICY "promoter-documents-service-role-all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'promoter-documents')
  WITH CHECK (bucket_id = 'promoter-documents');

-- Step 4: Show new policies
SELECT 
  '=== STEP 4: NEW POLICIES (AFTER) ===' as section,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN roles = '{public}' AND cmd = 'SELECT' THEN '✅ PUBLIC READ - Perfect for Google Docs API!'
    WHEN roles = '{authenticated}' THEN '🔒 Authenticated Only'
    WHEN roles = '{service_role}' THEN '🔑 Service Role'
    ELSE '🔐 Other'
  END as access_type
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%promoter-documents%' OR qual LIKE '%promoter-documents%')
ORDER BY cmd, policyname;

-- Step 5: Verify bucket is public
SELECT 
  '=== STEP 5: VERIFY BUCKET PUBLIC STATUS ===' as section,
  id,
  name,
  public,
  CASE 
    WHEN public = true THEN '✅ Bucket is PUBLIC'
    ELSE '❌ Bucket is PRIVATE - Run: UPDATE storage.buckets SET public = true WHERE id = ''promoter-documents'';'
  END as status
FROM storage.buckets
WHERE id = 'promoter-documents';

-- ============================================================================
-- 🎯 SUMMARY OF NEW POLICIES:
-- ============================================================================
-- 1. promoter-documents-public-select: Anyone can READ (no auth required)
-- 2. promoter-documents-authenticated-insert: Auth users can INSERT
-- 3. promoter-documents-authenticated-update: Auth users can UPDATE
-- 4. promoter-documents-authenticated-delete: Auth users can DELETE
-- 5. promoter-documents-service-role-all: Service role has full access
--
-- TOTAL: 5 simple, clear policies (down from 12+ conflicting ones)
-- ============================================================================

-- ============================================================================
-- 🧪 TESTING:
-- ============================================================================
-- After running this script:
-- 1. Open INCOGNITO browser
-- 2. Visit: https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
-- 3. Image should display WITHOUT login prompt
-- 4. If it works, re-run Make.com scenario
-- ============================================================================

