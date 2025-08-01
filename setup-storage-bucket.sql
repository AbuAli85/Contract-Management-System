-- Setup Storage Bucket for Document Uploads
-- This script creates the storage bucket and RLS policies for promoter documents

-- Create the storage bucket for promoter documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'promoter-documents',
    'promoter-documents',
    false,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'promoter-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'promoter-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'promoter-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'promoter-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create a function to automatically clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_documents()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete files from storage when promoter is deleted
    DELETE FROM storage.objects 
    WHERE bucket_id = 'promoter-documents' 
    AND name LIKE OLD.id::text || '/%';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean up documents when promoter is deleted
CREATE TRIGGER cleanup_promoter_documents
    BEFORE DELETE ON promoters
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_orphaned_documents();

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 