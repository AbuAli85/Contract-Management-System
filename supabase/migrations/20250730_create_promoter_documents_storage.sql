-- Create storage bucket for promoter documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for promoter documents storage
CREATE POLICY "Users can upload promoter documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view promoter documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update promoter documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete promoter documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

-- Create function to cleanup documents when promoter is deleted
CREATE OR REPLACE FUNCTION cleanup_promoter_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete ID card document
  IF OLD.id_card_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'promoter-documents' 
    AND name = OLD.id_card_url;
  END IF;
  
  -- Delete passport document
  IF OLD.passport_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'promoter-documents' 
    AND name = OLD.passport_url;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically cleanup documents
DROP TRIGGER IF EXISTS cleanup_promoter_documents_trigger ON promoters;
CREATE TRIGGER cleanup_promoter_documents_trigger
  BEFORE DELETE ON promoters
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_promoter_documents(); 