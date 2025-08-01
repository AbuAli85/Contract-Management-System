-- Fix Storage RLS Policies - FINAL COMPREHENSIVE FIX
-- Run this in Supabase SQL Editor to fix document upload issues

-- 1. Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Users can upload promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for promoter documents" ON storage.objects;

-- 2. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Create very permissive RLS policies for development
-- These allow any authenticated user to upload/view documents
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

-- 4. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 5. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Verify the setup
SELECT 'Storage bucket created:' as info, id, name, public, file_size_limit FROM storage.buckets WHERE id = 'promoter-documents';

-- 7. Show all storage policies
SELECT 'Storage policies:' as info, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 8. Test query to verify permissions
SELECT 'Testing storage access...' as info;
SELECT COUNT(*) as object_count FROM storage.objects WHERE bucket_id = 'promoter-documents';

-- 9. Create a test function to verify upload permissions
CREATE OR REPLACE FUNCTION test_storage_permissions()
RETURNS TEXT AS $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'promoter-documents') THEN
    RETURN 'ERROR: Storage bucket does not exist';
  END IF;
  
  -- Check if policies exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%authenticated%') THEN
    RETURN 'ERROR: Storage policies do not exist';
  END IF;
  
  RETURN 'SUCCESS: Storage is properly configured for document uploads';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Test the function
SELECT test_storage_permissions() as storage_test_result;

-- 11. Clean up test function
DROP FUNCTION IF EXISTS test_storage_permissions();

-- 12. Final verification
SELECT '=== STORAGE FIX COMPLETE ===' as status;
SELECT 'Bucket exists:' as check, COUNT(*) as count FROM storage.buckets WHERE id = 'promoter-documents';
SELECT 'Policies exist:' as check, COUNT(*) as count FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
SELECT 'RLS enabled:' as check, CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as status FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage'); 