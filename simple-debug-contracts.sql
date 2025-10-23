-- Simple debug script to identify problematic contracts
-- Run this in Supabase SQL Editor

-- Step 1: Find contracts with invalid client_id
SELECT 
    'client_id' as field_name,
    id as contract_id,
    contract_number,
    client_id as invalid_id
FROM contracts 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 2: Find contracts with invalid employer_id
SELECT 
    'employer_id' as field_name,
    id as contract_id,
    contract_number,
    employer_id as invalid_id
FROM contracts 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 3: Find contracts with invalid first_party_id
SELECT 
    'first_party_id' as field_name,
    id as contract_id,
    contract_number,
    first_party_id as invalid_id
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 4: Find contracts with invalid second_party_id
SELECT 
    'second_party_id' as field_name,
    id as contract_id,
    contract_number,
    second_party_id as invalid_id
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Step 5: Find contracts with invalid promoter_id
SELECT 
    'promoter_id' as field_name,
    id as contract_id,
    contract_number,
    promoter_id as invalid_id
FROM contracts 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Step 6: Count total problematic contracts
SELECT 
    COUNT(*) as total_problematic_contracts
FROM contracts 
WHERE (client_id IS NOT NULL AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (employer_id IS NOT NULL AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (first_party_id IS NOT NULL AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (second_party_id IS NOT NULL AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (promoter_id IS NOT NULL AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL));
