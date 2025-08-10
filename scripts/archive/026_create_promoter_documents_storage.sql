-- Create promoter documents storage bucket
-- This script sets up the storage bucket for promoter document uploads

-- Create the storage bucket for promoter documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the promoter documents bucket
-- Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload promoter documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promoter-documents' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to view documents
CREATE POLICY "Allow authenticated users to view promoter documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'promoter-documents' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update promoter documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promoter-documents' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete promoter documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promoter-documents' 
    AND auth.role() = 'authenticated'
  );

-- Create a function to clean up old documents when a promoter is deleted
CREATE OR REPLACE FUNCTION cleanup_promoter_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all documents for the deleted promoter
  DELETE FROM storage.objects 
  WHERE bucket_id = 'promoter-documents' 
    AND name LIKE OLD.id || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up documents when promoter is deleted
CREATE TRIGGER cleanup_promoter_documents_trigger
  BEFORE DELETE ON promoters
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_promoter_documents();

-- Add comments for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
COMMENT ON COLUMN storage.buckets.id IS 'Unique identifier for the bucket';
COMMENT ON COLUMN storage.buckets.name IS 'Display name for the bucket';
COMMENT ON COLUMN storage.buckets.public IS 'Whether the bucket is publicly accessible';
COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Maximum file size in bytes';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS 'Array of allowed MIME types';

COMMENT ON FUNCTION cleanup_promoter_documents() IS 'Cleans up promoter documents when a promoter is deleted';
COMMENT ON TRIGGER cleanup_promoter_documents_trigger ON promoters IS 'Automatically deletes promoter documents when promoter is deleted'; 