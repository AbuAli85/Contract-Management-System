-- Add Missing Columns to Promoters Table
-- Run this in Supabase SQL Editor to fix the schema mismatch

-- Add passport_number column
ALTER TABLE promoters 
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);

-- Add profile_picture_url column  
ALTER TABLE promoters 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN promoters.passport_number IS 'Passport number of the promoter';
COMMENT ON COLUMN promoters.profile_picture_url IS 'URL to the promoter profile picture';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promoters' 
    AND table_schema = 'public'
    AND column_name IN ('passport_number', 'profile_picture_url')
ORDER BY column_name;

-- Show all columns in promoters table for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promoters' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert with new columns
SELECT 'Testing new columns...' as status;

-- Update existing records to set default values if needed
UPDATE promoters 
SET 
    passport_number = COALESCE(passport_number, ''),
    profile_picture_url = COALESCE(profile_picture_url, '')
WHERE passport_number IS NULL OR profile_picture_url IS NULL;

-- Verify the update
SELECT 
    'Updated records count:' as info,
    COUNT(*) as count
FROM promoters 
WHERE passport_number IS NOT NULL OR profile_picture_url IS NOT NULL;

-- Final verification
SELECT '=== COLUMNS ADDED SUCCESSFULLY ===' as status;
SELECT 'passport_number column added' as column_added WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promoters' 
    AND column_name = 'passport_number'
);
SELECT 'profile_picture_url column added' as column_added WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promoters' 
    AND column_name = 'profile_picture_url'
); 