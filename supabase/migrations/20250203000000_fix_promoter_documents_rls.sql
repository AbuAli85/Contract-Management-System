-- Fix promoter_documents table and RLS policies
-- Date: 2025-02-03
-- Purpose: Ensure promoter_documents table exists with proper RLS policies

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.promoter_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promoter_documents_promoter_id 
  ON public.promoter_documents(promoter_id);

CREATE INDEX IF NOT EXISTS idx_promoter_documents_document_type 
  ON public.promoter_documents(document_type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_promoter_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_promoter_documents_updated_at ON public.promoter_documents;

CREATE TRIGGER set_promoter_documents_updated_at
    BEFORE UPDATE ON public.promoter_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_promoter_documents_updated_at();

-- Enable RLS
ALTER TABLE public.promoter_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON public.promoter_documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON public.promoter_documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON public.promoter_documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON public.promoter_documents;

-- Create RLS policies for authenticated users
-- Policy: Allow authenticated users to view all documents
CREATE POLICY "Allow authenticated users to view documents"
  ON public.promoter_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents"
  ON public.promoter_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents"
  ON public.promoter_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents"
  ON public.promoter_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promoter_documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comment on table
COMMENT ON TABLE public.promoter_documents IS 'Stores documents uploaded for promoters (ID cards, passports, certificates, etc.)';

