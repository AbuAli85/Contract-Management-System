-- Simplified Fix for Passport Issues
-- This script addresses the passport display and upload issues without creating views

-- 1. Ensure passport_number column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_number') THEN
        ALTER TABLE promoters ADD COLUMN passport_number TEXT;
        RAISE NOTICE 'Added passport_number column to promoters table';
    ELSE
        RAISE NOTICE 'passport_number column already exists';
    END IF;
END $$;

-- 2. Add comments for documentation
COMMENT ON COLUMN promoters.passport_number IS 'Passport number of the promoter';
COMMENT ON COLUMN promoters.passport_url IS 'URL to the uploaded passport document';
COMMENT ON COLUMN promoters.passport_expiry_date IS 'Expiry date of the passport';

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promoters_passport_number ON promoters(passport_number);
CREATE INDEX IF NOT EXISTS idx_promoters_passport_expiry ON promoters(passport_expiry_date);

-- 4. Update existing records to have default values if needed
UPDATE promoters 
SET passport_number = COALESCE(passport_number, ''),
    passport_url = COALESCE(passport_url, '')
WHERE passport_number IS NULL OR passport_url IS NULL;

-- 5. Fix any potential data type issues
ALTER TABLE promoters 
ALTER COLUMN passport_number TYPE TEXT,
ALTER COLUMN passport_url TYPE TEXT,
ALTER COLUMN passport_expiry_date TYPE DATE;

-- 6. Add constraints for data integrity (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_passport_number_length') THEN
        ALTER TABLE promoters 
        ADD CONSTRAINT check_passport_number_length 
        CHECK (LENGTH(passport_number) <= 50);
    END IF;
END $$;

-- 7. Verify the fixes
SELECT 
    'passport_number' as column_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_number') as exists
UNION ALL
SELECT 
    'passport_url' as column_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_url') as exists
UNION ALL
SELECT 
    'passport_expiry_date' as column_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_expiry_date') as exists;

-- 8. Show sample data to verify
SELECT 
    id,
    name_en,
    passport_number,
    passport_url,
    passport_expiry_date
FROM promoters 
WHERE passport_number IS NOT NULL OR passport_url IS NOT NULL
LIMIT 5; 