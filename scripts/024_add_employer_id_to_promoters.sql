-- Add employer_id back to promoters table for proper employer linking
-- This allows promoters to be associated with specific employers

DO $$
BEGIN
    -- Add employer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='employer_id') THEN
        ALTER TABLE promoters ADD COLUMN employer_id UUID REFERENCES parties(id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.employer_id IS 'Foreign key to the party acting as the employer for this promoter.';
    END IF;
END $$;

-- Update existing promoters to have a default employer if needed
-- This is optional and can be customized based on business logic
-- UPDATE promoters SET employer_id = (SELECT id FROM parties WHERE type = 'Employer' LIMIT 1) WHERE employer_id IS NULL; 