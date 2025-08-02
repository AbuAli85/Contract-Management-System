-- Direct SQL to create storage bucket
-- This should be run in the Supabase SQL Editor

-- Create the bucket directly in storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Allow authenticated users to upload to promoter-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promoter-documents');

CREATE POLICY "Allow authenticated users to read from promoter-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'promoter-documents');

CREATE POLICY "Allow authenticated users to update in promoter-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'promoter-documents');

CREATE POLICY "Allow authenticated users to delete from promoter-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'promoter-documents');

-- Alternative: Allow service role to bypass all policies
CREATE POLICY "Service role access to promoter-documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'promoter-documents')
WITH CHECK (bucket_id = 'promoter-documents');
