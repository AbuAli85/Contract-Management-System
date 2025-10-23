-- Targeted fix for first_party_id and second_party_id foreign key issues
-- Run this in Supabase SQL Editor

-- Step 1: Find contracts with invalid first_party_id
SELECT 
    'first_party_id' as field_name,
    id as contract_id,
    contract_number,
    first_party_id as invalid_id
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 2: Find contracts with invalid second_party_id
SELECT 
    'second_party_id' as field_name,
    id as contract_id,
    contract_number,
    second_party_id as invalid_id
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 3: Set invalid first_party_id references to NULL
UPDATE contracts 
SET first_party_id = NULL 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 4: Set invalid second_party_id references to NULL
UPDATE contracts 
SET second_party_id = NULL 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 5: Verify the fix
SELECT 
    'After Fix Verification' as status,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_client_ids,
    COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as valid_employer_ids,
    COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as valid_promoter_ids,
    COUNT(*) - COUNT(CASE WHEN client_id IS NOT NULL AND client_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_client_ids,
    COUNT(*) - COUNT(CASE WHEN employer_id IS NOT NULL AND employer_id::uuid IN (SELECT id FROM parties) THEN 1 END) as invalid_employer_ids,
    COUNT(*) - COUNT(CASE WHEN promoter_id IS NOT NULL AND promoter_id::uuid IN (SELECT id FROM promoters) THEN 1 END) as invalid_promoter_ids
FROM contracts;

-- Step 6: Check remaining first_party_id and second_party_id counts
SELECT 
    'Remaining Foreign Keys' as check_type,
    COUNT(CASE WHEN first_party_id IS NOT NULL THEN 1 END) as contracts_with_first_party_id,
    COUNT(CASE WHEN second_party_id IS NOT NULL THEN 1 END) as contracts_with_second_party_id
FROM contracts;
