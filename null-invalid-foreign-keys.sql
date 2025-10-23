-- Alternative fix: Set invalid foreign keys to NULL
-- Run this in Supabase SQL Editor

-- Step 1: Set invalid client_id references to NULL
UPDATE contracts 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 2: Set invalid employer_id references to NULL
UPDATE contracts 
SET employer_id = NULL 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

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

-- Step 5: Set invalid promoter_id references to NULL
UPDATE contracts 
SET promoter_id = NULL 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Step 6: Verify the fix
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

-- Step 7: Show summary of contracts with NULL foreign keys
SELECT 
    'Contracts with NULL foreign keys' as summary,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as contracts_with_null_client_id,
    COUNT(CASE WHEN employer_id IS NULL THEN 1 END) as contracts_with_null_employer_id,
    COUNT(CASE WHEN first_party_id IS NULL THEN 1 END) as contracts_with_null_first_party_id,
    COUNT(CASE WHEN second_party_id IS NULL THEN 1 END) as contracts_with_null_second_party_id,
    COUNT(CASE WHEN promoter_id IS NULL THEN 1 END) as contracts_with_null_promoter_id
FROM contracts;
