-- Check current contract table schema
-- This will help identify what columns exist and what's missing

-- Show all columns in the contracts table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'first_party_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as first_party_id_status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'second_party_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as second_party_id_status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'promoter_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as promoter_id_status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as client_id_status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'employer_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as employer_id_status;

-- Show sample data to see what's actually stored
SELECT 
    id,
    contract_number,
    title,
    contract_type,
    status,
    is_current,
    priority,
    start_date,
    end_date,
    first_party_id,
    second_party_id,
    promoter_id,
    client_id,
    employer_id
FROM contracts 
LIMIT 3;
