-- Fix Storage RLS Policies for Promoter Documents
-- This script fixes the Row Level Security policies that are preventing document uploads

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete promoter documents" ON storage.objects;

-- Create more permissive RLS policies for authenticated users
CREATE POLICY "Authenticated users can upload promoter documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view promoter documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update promoter documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete promoter documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

-- Alternative: Create more permissive policies for development/testing
-- Uncomment the following if you need more permissive policies during development

-- CREATE POLICY "Allow all operations for promoter documents" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'promoter-documents'
--   );

-- Make sure the storage bucket exists and is properly configured
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

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%promoter%'; 