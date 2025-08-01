-- Fix Storage RLS Policies Only
-- Run this AFTER creating the bucket in Supabase Dashboard
-- Run this in Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;

-- Create RLS policies for authenticated users
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

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;

-- Verify the setup
SELECT 'Storage policies created:' as info, COUNT(*) as count FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Show all storage policies
SELECT 'Storage policies:' as info, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Final verification
SELECT '=== STORAGE POLICIES FIX COMPLETE ===' as status; 