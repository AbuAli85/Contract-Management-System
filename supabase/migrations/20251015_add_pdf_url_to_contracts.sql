-- Migration: Add pdf_url column to contracts table
-- Date: 2025-10-15
-- Description: Add pdf_url field to store generated PDF document URLs

-- Add pdf_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE contracts 
    ADD COLUMN pdf_url TEXT;
    
    COMMENT ON COLUMN contracts.pdf_url IS 'URL to the generated PDF contract document';
  END IF;
END $$;

-- Add google_doc_url column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'google_doc_url'
  ) THEN
    ALTER TABLE contracts 
    ADD COLUMN google_doc_url TEXT;
    
    COMMENT ON COLUMN contracts.google_doc_url IS 'URL to the Google Docs version of the contract (legacy)';
  END IF;
END $$;

