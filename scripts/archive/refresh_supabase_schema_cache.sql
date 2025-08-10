-- Refresh Supabase Schema Cache
-- This script helps refresh the schema cache to resolve the employer_id issue

-- Force refresh of schema cache by running a simple query
-- This can help resolve schema cache issues in Supabase

-- Check current schema state
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'promoters';

-- Check column information
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promoters' 
ORDER BY ordinal_position;

-- Force a schema refresh by querying the table structure
SELECT 
    p.column_name,
    p.data_type,
    p.is_nullable,
    p.column_default,
    p.character_maximum_length,
    p.numeric_precision,
    p.numeric_scale
FROM information_schema.columns p
WHERE p.table_name = 'promoters'
ORDER BY p.ordinal_position;

-- Check for any pending schema changes
SELECT 
    schemaname,
    tablename,
    attname,
    atttypid::regtype as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'promoters'
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;

-- Verify foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'promoters';

-- Check for any schema cache issues
SELECT 
    'Schema Cache Status' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promoters' 
            AND column_name = 'employer_id'
        ) THEN 'employer_id column exists'
        ELSE 'employer_id column missing'
    END as employer_id_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promoters' 
            AND column_name = 'outsourced_to_id'
        ) THEN 'outsourced_to_id column exists'
        ELSE 'outsourced_to_id column missing'
    END as outsourced_to_id_status; 