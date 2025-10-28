-- ========================================
-- 🔍 DIAGNOSE: Check user_role_assignments Table Structure
-- ========================================
-- Run this first to see the actual structure of your tables

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_role_assignments'
        ) THEN '✅ user_role_assignments table exists'
        ELSE '❌ user_role_assignments table NOT FOUND'
    END as table_status;

-- Show actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_role_assignments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for primary key
SELECT
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_role_assignments'
AND tc.constraint_type = 'PRIMARY KEY';

-- Show sample data structure
SELECT * FROM user_role_assignments LIMIT 3;

-- Check for duplicates using available columns
SELECT 
    user_id,
    role_id,
    COUNT(*) as duplicate_count
FROM user_role_assignments
GROUP BY user_id, role_id
HAVING COUNT(*) > 1;

-- Also check role_permissions table structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'role_permissions'
AND table_schema = 'public'
ORDER BY ordinal_position;

