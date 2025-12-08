-- Debug script to identify the exact problematic contracts
-- Run this in Supabase SQL Editor

-- Step 1: Find the exact contracts with invalid foreign keys
SELECT 
    id,
    contract_number,
    title,
    client_id,
    employer_id,
    first_party_id,
    second_party_id,
    promoter_id,
    CASE 
        WHEN client_id IS NOT NULL AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL) THEN 'invalid_client_id'
        WHEN employer_id IS NOT NULL AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL) THEN 'invalid_employer_id'
        WHEN first_party_id IS NOT NULL AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL) THEN 'invalid_first_party_id'
        WHEN second_party_id IS NOT NULL AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL) THEN 'invalid_second_party_id'
        WHEN promoter_id IS NOT NULL AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL) THEN 'invalid_promoter_id'
        ELSE 'unknown'
    END as issue_type
FROM contracts 
WHERE (client_id IS NOT NULL AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (employer_id IS NOT NULL AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (first_party_id IS NOT NULL AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (second_party_id IS NOT NULL AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
   OR (promoter_id IS NOT NULL AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL))
ORDER BY contract_number;

-- Step 2: Get the specific invalid IDs
SELECT DISTINCT
    'client_id' as field_name,
    client_id::text as invalid_id,
    COUNT(*) as contract_count
FROM contracts 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
GROUP BY client_id

UNION ALL

SELECT DISTINCT
    'employer_id' as field_name,
    employer_id::text as invalid_id,
    COUNT(*) as contract_count
FROM contracts 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
GROUP BY employer_id

UNION ALL

SELECT DISTINCT
    'first_party_id' as field_name,
    first_party_id::text as invalid_id,
    COUNT(*) as contract_count
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
GROUP BY first_party_id

UNION ALL

SELECT DISTINCT
    'second_party_id' as field_name,
    second_party_id::text as invalid_id,
    COUNT(*) as contract_count
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
GROUP BY second_party_id

UNION ALL

SELECT DISTINCT
    'promoter_id' as field_name,
    promoter_id::text as invalid_id,
    COUNT(*) as contract_count
FROM contracts 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL)
GROUP BY promoter_id
ORDER BY field_name, invalid_id;
