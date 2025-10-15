-- ============================================
-- CHECK USERS TABLE SCHEMA
-- ============================================
-- This script checks the actual structure of the users table

-- Check what columns exist in the users table
SELECT 
  '🔍 Users Table Schema' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data structure
SELECT 
  '🔍 Sample User Data' as check_type,
  *
FROM users 
LIMIT 1;

-- Check if updated_at column exists
SELECT 
  '🔍 Column Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'updated_at'
    ) 
    THEN '✅ updated_at column exists'
    ELSE '❌ updated_at column does not exist'
  END as updated_at_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'created_at'
    ) 
    THEN '✅ created_at column exists'
    ELSE '❌ created_at column does not exist'
  END as created_at_status;

