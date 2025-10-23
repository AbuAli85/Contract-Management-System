-- Diagnostic script to understand the foreign key issue
-- Run this in Supabase SQL Editor

-- Step 1: Check if there are actually any invalid foreign keys
SELECT 
    'Invalid first_party_id check' as check_type,
    COUNT(*) as count
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

SELECT 
    'Invalid second_party_id check' as check_type,
    COUNT(*) as count
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 2: Check what the verification query is actually counting
-- This is the exact logic from the verification query
SELECT 
    'Verification Logic Analysis' as analysis_type,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as contracts_with_client_id,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_client_ids,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid NOT IN (SELECT id FROM parties) THEN 1 END) as invalid_client_ids
FROM contracts;

-- Step 3: Check if the issue is with the IN clause logic
-- Maybe some parties have NULL ids that are causing issues
SELECT 
    'Parties with NULL ids' as check_type,
    COUNT(*) as count
FROM parties 
WHERE id IS NULL;

-- Step 4: Check if the issue is with UUID casting
-- Maybe some first_party_id/second_party_id values can't be cast to UUID
SELECT 
    'UUID casting issues' as check_type,
    COUNT(*) as count
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 5: Let's see the actual values that might be problematic
SELECT 
    'Sample first_party_id values' as sample_type,
    first_party_id,
    COUNT(*) as count
FROM contracts 
WHERE first_party_id IS NOT NULL
GROUP BY first_party_id
ORDER BY count DESC
LIMIT 10;

-- Step 6: Check if the issue is with the verification query itself
-- Let's break down the verification query step by step
SELECT 
    'Step by step verification' as step_type,
    COUNT(*) as total,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as has_client_id,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as client_id_in_parties,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid NOT IN (SELECT id FROM parties) THEN 1 END) as client_id_not_in_parties
FROM contracts;
