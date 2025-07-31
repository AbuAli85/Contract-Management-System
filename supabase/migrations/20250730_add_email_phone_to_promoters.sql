-- Add email and phone fields to promoters table
-- These fields are needed for the Excel import functionality

DO $$
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='email') THEN
        ALTER TABLE promoters ADD COLUMN email TEXT;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_promoters_email ON promoters(email);
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.email IS 'Email address of the promoter';
    END IF;
END $$;

DO $$
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='phone') THEN
        ALTER TABLE promoters ADD COLUMN phone TEXT;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_promoters_phone ON promoters(phone);
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.phone IS 'Phone number of the promoter';
    END IF;
END $$; 