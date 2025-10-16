-- ============================================================================
-- ENABLE PUBLIC READ ACCESS FOR PROMOTER-DOCUMENTS STORAGE BUCKET
-- ============================================================================
-- This script creates an RLS policy to allow public (unauthenticated) read
-- access to the 'promoter-documents' bucket. This is required for external
-- services like Google Docs API (via Make.com) to retrieve images.
--
-- IMPORTANT: This only affects READ access. Write/Update/Delete operations
-- still require authentication via existing RLS policies.
-- ============================================================================

-- Step 1: Check existing policies
SELECT 
  '=== BEFORE: Checking existing public read policies ===' as section,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%public%read%'
ORDER BY policyname;

-- Step 2: Create a new RLS policy for public read access
-- This allows anyone (authenticated or not) to SELECT/read files from promoter-documents
CREATE POLICY "Public read access for promoter-documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'promoter-documents');

-- Step 3: Verify the new policy was created
SELECT 
  '=== AFTER: Verifying new public read policy ===' as section,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname = 'Public read access for promoter-documents';

-- Step 4: Test the policy by listing all policies for promoter-documents bucket
SELECT 
  '=== ALL POLICIES FOR PROMOTER-DOCUMENTS ===' as section,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual LIKE '%auth.role()%authenticated%' THEN '🔒 Requires Auth'
    WHEN qual = '(bucket_id = ''promoter-documents''::text)' THEN '🌍 Public Access'
    ELSE '🔐 Conditional'
  END as access_level
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND (qual LIKE '%promoter-documents%' OR policyname LIKE '%promoter-documents%')
ORDER BY cmd, policyname;

-- ============================================================================
-- 🎯 EXPECTED RESULT:
-- ============================================================================
-- A new policy named "Public read access for promoter-documents" should be created
-- with:
--   - Command: SELECT
--   - Roles: {public}
--   - Condition: bucket_id = 'promoter-documents'
--
-- This allows unauthenticated users to read/download files from the bucket.
-- ============================================================================

-- ============================================================================
-- 🧪 TESTING:
-- ============================================================================
-- After running this script:
-- 1. Open a private/incognito browser window (to simulate unauthenticated access)
-- 2. Try accessing one of your image URLs directly:
--    https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
-- 3. The image should now display without requiring authentication
-- 4. Re-run your Make.com scenario to generate a contract with images
-- ============================================================================

-- ============================================================================
-- 📝 NOTES:
-- ============================================================================
-- • This policy only affects SELECT (read) operations
-- • All INSERT, UPDATE, DELETE operations still require authentication
-- • The bucket must also be set to public = true (done in previous script)
-- • This is safe for public documents like ID cards and passports that need
--   to be accessible by external services (Make.com, Google Docs API)
-- ============================================================================

