-- Test script to verify pending contracts functionality
-- Run this in Supabase SQL Editor

-- Step 1: Check if there are any contracts with pending status
SELECT 
    'Pending Status Check' as check_type,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

-- Step 2: Check contracts that should appear in pending contracts page
-- (status = 'pending' OR status IN ('legal_review', 'hr_review', 'final_approval', 'signature'))
SELECT 
    'Pending Contracts' as category,
    COUNT(*) as total_pending_contracts
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature');

-- Step 3: Show sample pending contracts
SELECT 
    id,
    contract_number,
    title,
    status,
    client_id,
    employer_id,
    promoter_id,
    created_at
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Check if the API query would work
-- This simulates what the API does
SELECT 
    'API Simulation' as test_type,
    COUNT(*) as contracts_found
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
  AND (client_id IS NULL OR client_id::uuid IN (SELECT id FROM parties WHERE id IS NOT NULL))
  AND (employer_id IS NULL OR employer_id::uuid IN (SELECT id FROM parties WHERE id IS NOT NULL))
  AND (promoter_id IS NULL OR promoter_id::uuid IN (SELECT id FROM promoters WHERE id IS NOT NULL));

-- Step 5: Final verification - this should match your original verification
SELECT 
    'Final Verification' as status,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_client_ids,
    COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_employer_ids,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as valid_promoter_ids,
    COUNT(*) - COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_client_ids,
    COUNT(*) - COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_employer_ids,
    COUNT(*) - COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as invalid_promoter_ids
FROM contracts;
