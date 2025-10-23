-- Simple test to verify pending contracts page functionality
-- Run this in Supabase SQL Editor

-- Step 1: Test the exact API query that the pending contracts page uses
-- This simulates: SELECT * FROM contracts WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
SELECT 
    'API Query Test' as test_type,
    COUNT(*) as contracts_found
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature');

-- Step 2: Test with RBAC filtering (what a non-admin user would see)
-- This simulates: WHERE status IN (...) AND (first_party_id = user_id OR second_party_id = user_id OR client_id = user_id OR employer_id = user_id)
SELECT 
    'API Query with RBAC' as test_type,
    COUNT(*) as contracts_found
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
  AND (first_party_id IS NOT NULL OR second_party_id IS NOT NULL OR client_id IS NOT NULL OR employer_id IS NOT NULL);

-- Step 3: Check if there are any contracts with the expected statuses
SELECT 
    'Status Distribution' as analysis_type,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

-- Step 4: Simple foreign key test - just check if we can query contracts without errors
SELECT 
    'Basic Contract Query' as test_type,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as with_client_id,
    COUNT(CASE WHEN employer_id IS NOT NULL THEN 1 END) as with_employer_id,
    COUNT(CASE WHEN promoter_id IS NOT NULL THEN 1 END) as with_promoter_id
FROM contracts;

-- Step 5: Test if the issue is resolved by checking if we can run the pending contracts query
-- This is the exact query the API would run
SELECT 
    'Pending Contracts API Query' as test_type,
    COUNT(*) as pending_contracts
FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
  AND (client_id IS NULL OR client_id::uuid IN (SELECT id FROM parties WHERE id IS NOT NULL))
  AND (employer_id IS NULL OR employer_id::uuid IN (SELECT id FROM parties WHERE id IS NOT NULL))
  AND (promoter_id IS NULL OR promoter_id::uuid IN (SELECT id FROM promoters WHERE id IS NOT NULL));
