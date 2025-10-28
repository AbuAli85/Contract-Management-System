-- Fix promoter_documents table - Add missing timestamp columns
-- Run this in Supabase SQL Editor

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_documents' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE promoter_documents 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Set created_at for existing rows based on uploaded_at if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promoter_documents' 
            AND column_name = 'uploaded_at'
        ) THEN
            UPDATE promoter_documents 
            SET created_at = uploaded_at 
            WHERE created_at IS NULL;
        END IF;
        
        RAISE NOTICE 'Added created_at column to promoter_documents';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_documents' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE promoter_documents 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Set updated_at for existing rows
        UPDATE promoter_documents 
        SET updated_at = created_at 
        WHERE updated_at IS NULL AND created_at IS NOT NULL;
        
        RAISE NOTICE 'Added updated_at column to promoter_documents';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_promoter_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_promoter_documents_updated_at ON promoter_documents;

-- Create the trigger
CREATE TRIGGER set_promoter_documents_updated_at
    BEFORE UPDATE ON promoter_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_promoter_documents_updated_at();

-- Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promoter_documents'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

SELECT 
    '✅ promoter_documents table fixed! Columns added:' as status,
    COUNT(*) FILTER (WHERE column_name = 'created_at') as has_created_at,
    COUNT(*) FILTER (WHERE column_name = 'updated_at') as has_updated_at
FROM information_schema.columns
WHERE table_name = 'promoter_documents'
AND column_name IN ('created_at', 'updated_at');

