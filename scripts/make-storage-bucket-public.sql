-- ============================================================================
-- MAKE PROMOTER-DOCUMENTS STORAGE BUCKET PUBLIC
-- ============================================================================
-- Fixes: "There was a problem retrieving the image" error in Make.com
-- Allows Google Docs API to fetch images from Supabase Storage
-- ============================================================================

-- 1. Check current bucket status
SELECT 
  '=== CURRENT BUCKET STATUS ===' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'promoter-documents';

-- 2. Make the bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'promoter-documents';

-- 3. Verify bucket is now public
SELECT 
  '=== AFTER: Bucket Status ===' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'promoter-documents';

-- 4. Check existing RLS policies on storage.objects
SELECT 
  '=== EXISTING RLS POLICIES ===' as section,
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
  AND (qual LIKE '%promoter-documents%' OR policyname LIKE '%promoter%')
ORDER BY policyname;

-- ============================================================================
-- 🎯 EXPECTED RESULTS:
-- ============================================================================
-- BEFORE:
-- - public: false (bucket is private)
-- - Google Docs API: Cannot access images
--
-- AFTER:
-- - public: true (bucket is public)
-- - Google Docs API: Can fetch images successfully
-- - URLs work in browser without authentication
-- - Make.com contract generation works
-- ============================================================================

-- ============================================================================
-- 🧪 TESTING:
-- ============================================================================
-- After running, test one URL in your browser (incognito mode):
-- https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
--
-- If it displays the image ✅ - Bucket is now public!
-- If it asks for login ❌ - Run this script again or check bucket settings
-- ============================================================================

-- ============================================================================
-- 🔒 SECURITY NOTE:
-- ============================================================================
-- Making the bucket public means:
-- ✅ Anyone with the URL can view the documents
-- ✅ Required for Google Docs API to fetch images
-- ✅ Still secured by obscure file names (hard to guess)
-- ❌ Not suitable for highly sensitive documents
--
-- Alternative if you need private storage:
-- - Use signed URLs (requires backend processing)
-- - Store images in Google Drive instead
-- ============================================================================

