-- Verification script that matches the original verification query
-- Run this in Supabase SQL Editor

-- This matches exactly what the verification query does
SELECT 
    'Detailed Verification' as status,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_client_ids,
    COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_employer_ids,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as valid_promoter_ids,
    COUNT(*) - COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_client_ids,
    COUNT(*) - COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_employer_ids,
    COUNT(*) - COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as invalid_promoter_ids
FROM contracts;

-- Check if there are any contracts with NULL values that might be causing the discrepancy
SELECT 
    'NULL Analysis' as analysis_type,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as null_client_ids,
    COUNT(CASE WHEN employer_id IS NULL THEN 1 END) as null_employer_ids,
    COUNT(CASE WHEN promoter_id IS NULL THEN 1 END) as null_promoter_ids,
    COUNT(CASE WHEN first_party_id IS NULL THEN 1 END) as null_first_party_ids,
    COUNT(CASE WHEN second_party_id IS NULL THEN 1 END) as null_second_party_ids
FROM contracts;

-- Check for contracts where the foreign key exists but might have other issues
SELECT 
    'Foreign Key Existence Check' as check_type,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as contracts_with_client_id,
    COUNT(CASE WHEN employer_id IS NOT NULL THEN 1 END) as contracts_with_employer_id,
    COUNT(CASE WHEN promoter_id IS NOT NULL THEN 1 END) as contracts_with_promoter_id,
    COUNT(CASE WHEN first_party_id IS NOT NULL THEN 1 END) as contracts_with_first_party_id,
    COUNT(CASE WHEN second_party_id IS NOT NULL THEN 1 END) as contracts_with_second_party_id
FROM contracts;
