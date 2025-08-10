-- Check Promoters Table Structure
-- This script helps identify the correct column names in the promoters table

-- Check all columns in the promoters table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promoters' 
ORDER BY ordinal_position;

-- Check for expiry-related columns specifically
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'promoters' 
  AND column_name LIKE '%expiry%'
ORDER BY column_name;

-- Check for ID-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'promoters' 
  AND column_name LIKE '%id%'
ORDER BY column_name;

-- Check for passport-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'promoters' 
  AND column_name LIKE '%passport%'
ORDER BY column_name; 