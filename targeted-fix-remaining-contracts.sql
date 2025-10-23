-- Targeted fix for remaining 4 contracts with invalid foreign keys
-- Run this in Supabase SQL Editor

-- Step 1: Identify the specific contracts with invalid foreign keys
SELECT 
    id,
    contract_number,
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
   OR (promoter_id IS NOT NULL AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL));

-- Step 2: Get the specific invalid IDs that need to be created
SELECT DISTINCT
    'client_id' as field_name,
    client_id as invalid_id
FROM contracts 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)

UNION ALL

SELECT DISTINCT
    'employer_id' as field_name,
    employer_id as invalid_id
FROM contracts 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)

UNION ALL

SELECT DISTINCT
    'first_party_id' as field_name,
    first_party_id as invalid_id
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)

UNION ALL

SELECT DISTINCT
    'second_party_id' as field_name,
    second_party_id as invalid_id
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)

UNION ALL

SELECT DISTINCT
    'promoter_id' as field_name,
    promoter_id as invalid_id
FROM contracts 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Step 3: After you see the results above, create the missing parties/promoters
-- Example for parties:
-- INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
-- VALUES ('invalid-id-here', 'Placeholder', 'مؤقت', 'PLACEHOLDER', 'Generic', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Example for promoters:
-- INSERT INTO promoters (id, name_en, name_ar, id_card_number, created_at, updated_at)
-- VALUES ('invalid-id-here', 'Placeholder Promoter', 'مروج مؤقت', 'PLACEHOLDER', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Final verification
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
