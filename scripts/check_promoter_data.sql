-- Check contracts with null promoter_id
-- This script helps diagnose missing promoter data in contracts

-- 1. Count contracts with null promoter_id
SELECT 
    COUNT(*) as total_contracts,
    COUNT(promoter_id) as contracts_with_promoter,
    COUNT(*) - COUNT(promoter_id) as contracts_without_promoter,
    ROUND(100.0 * COUNT(promoter_id) / NULLIF(COUNT(*), 0), 2) as percentage_with_promoter
FROM contracts;

-- 2. Show sample contracts with null promoter_id
SELECT 
    id,
    contract_number,
    title,
    promoter_id,
    first_party_id,
    second_party_id,
    status,
    created_at
FROM contracts
WHERE promoter_id IS NULL
LIMIT 10;

-- 3. Check if promoters table has data
SELECT 
    COUNT(*) as total_promoters,
    COUNT(*) FILTER (WHERE status = 'active') as active_promoters
FROM promoters;

-- 4. Show distribution of contracts by status
SELECT 
    status,
    COUNT(*) as count,
    COUNT(promoter_id) as with_promoter,
    COUNT(*) - COUNT(promoter_id) as without_promoter
FROM contracts
GROUP BY status
ORDER BY count DESC;

-- 5. Check foreign key relationship
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'contracts'
    AND kcu.column_name = 'promoter_id';

