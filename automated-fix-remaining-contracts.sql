-- Automated fix for remaining invalid foreign keys
-- Run this in Supabase SQL Editor

-- Step 1: Create missing parties automatically
INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
SELECT DISTINCT
    client_id::uuid as id,
    'Placeholder Client ' || SUBSTRING(client_id::text, 1, 8) as name_en,
    'عميل مؤقت ' || SUBSTRING(client_id::text, 1, 8) as name_ar,
    'PLACEHOLDER-' || SUBSTRING(client_id::text, 1, 8) as crn,
    'Client' as type,
    NOW() as created_at,
    NOW() as updated_at
FROM contracts 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
SELECT DISTINCT
    employer_id::uuid as id,
    'Placeholder Employer ' || SUBSTRING(employer_id::text, 1, 8) as name_en,
    'صاحب عمل مؤقت ' || SUBSTRING(employer_id::text, 1, 8) as name_ar,
    'PLACEHOLDER-' || SUBSTRING(employer_id::text, 1, 8) as crn,
    'Employer' as type,
    NOW() as created_at,
    NOW() as updated_at
FROM contracts 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
SELECT DISTINCT
    first_party_id::uuid as id,
    'Placeholder First Party ' || SUBSTRING(first_party_id::text, 1, 8) as name_en,
    'طرف أول مؤقت ' || SUBSTRING(first_party_id::text, 1, 8) as name_ar,
    'PLACEHOLDER-' || SUBSTRING(first_party_id::text, 1, 8) as crn,
    'Generic' as type,
    NOW() as created_at,
    NOW() as updated_at
FROM contracts 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
SELECT DISTINCT
    second_party_id::uuid as id,
    'Placeholder Second Party ' || SUBSTRING(second_party_id::text, 1, 8) as name_en,
    'طرف ثاني مؤقت ' || SUBSTRING(second_party_id::text, 1, 8) as name_ar,
    'PLACEHOLDER-' || SUBSTRING(second_party_id::text, 1, 8) as crn,
    'Generic' as type,
    NOW() as created_at,
    NOW() as updated_at
FROM contracts 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create missing promoters automatically
INSERT INTO promoters (id, name_en, name_ar, id_card_number, created_at, updated_at)
SELECT DISTINCT
    promoter_id::uuid as id,
    'Placeholder Promoter ' || SUBSTRING(promoter_id::text, 1, 8) as name_en,
    'مروج مؤقت ' || SUBSTRING(promoter_id::text, 1, 8) as name_ar,
    'PLACEHOLDER-' || SUBSTRING(promoter_id::text, 1, 8) as id_card_number,
    NOW() as created_at,
    NOW() as updated_at
FROM contracts 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Final verification
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
