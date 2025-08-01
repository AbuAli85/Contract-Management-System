-- Fix Storage for Supabase - Compatible Version
-- Run this in Supabase SQL Editor to fix document upload issues

-- 1. Create the storage bucket if it doesn't exist
-- Note: We can't directly INSERT into storage.buckets, so we'll use the proper method
-- The bucket should be created through the Supabase dashboard or API

-- 2. Create RLS policies for the storage bucket (these will work once bucket exists)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for promoter documents" ON storage.objects;

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

-- 4. Grant necessary permissions (these should work)
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 5. Verify the setup
SELECT 'Storage policies created:' as info, COUNT(*) as count FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. Show all storage policies
SELECT 'Storage policies:' as info, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 7. Final verification
SELECT '=== STORAGE POLICIES FIX COMPLETE ===' as status;
SELECT 'Policies exist:' as check, COUNT(*) as count FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
SELECT 'RLS enabled:' as check, CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as status FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage'); 