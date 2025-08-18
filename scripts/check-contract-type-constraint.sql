-- Check contract_type constraint values
-- This script shows what values are allowed for contract_type
-- Date: 2025-01-20

-- Step 1: Check the check constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contracts'::regclass 
AND contype = 'c'
AND conname LIKE '%contract_type%';

-- Step 2: Check all check constraints on the contracts table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contracts'::regclass 
AND contype = 'c';

-- Step 3: Check the current data types and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
AND column_name = 'contract_type'
ORDER BY column_name;

-- Step 4: Show sample contract_type values currently in the database
SELECT DISTINCT contract_type, COUNT(*) as count
FROM contracts 
WHERE contract_type IS NOT NULL
GROUP BY contract_type
ORDER BY contract_type;

-- Step 5: Try to see the actual constraint definition
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contracts' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';
