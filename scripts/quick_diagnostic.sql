-- ========================================
-- 🔍 QUICK RBAC DIAGNOSTIC
-- ========================================
-- Run this to see exactly what's happening with the constraint

-- Check the exact constraint definition
SELECT 
    'Category constraint' as check_item,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rbac_roles'::regclass 
AND contype = 'c' 
AND conname LIKE '%category%';

-- Check what categories are currently allowed
SELECT DISTINCT category FROM rbac_roles;

-- Check if the table exists and its structure
SELECT 
    'rbac_roles table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_roles') as result;

-- Show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rbac_roles'
ORDER BY ordinal_position;

-- Check if there are any enum types
SELECT 
    'Enum types' as check_item,
    typname as enum_name,
    enumlabel as enum_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname LIKE '%category%' OR t.typname LIKE '%rbac%'
ORDER BY t.typname, e.enumsortorder;
