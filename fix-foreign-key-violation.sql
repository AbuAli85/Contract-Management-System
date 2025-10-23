-- Quick fix for foreign key constraint violation
-- Run this in your Supabase SQL Editor

-- Step 1: Create the missing party
INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Placeholder Client',
    'عميل مؤقت',
    'PLACEHOLDER-001',
    'Client',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Check if there are other missing parties
SELECT DISTINCT client_id, employer_id, first_party_id, second_party_id
FROM contracts 
WHERE client_id IS NOT NULL 
   OR employer_id IS NOT NULL 
   OR first_party_id IS NOT NULL 
   OR second_party_id IS NOT NULL;

-- Step 3: If you see other UUIDs that don't exist in parties table, 
-- either create them or set them to NULL:

-- Example: Set invalid references to NULL
-- UPDATE contracts SET client_id = NULL WHERE client_id = 'some-invalid-uuid';
-- UPDATE contracts SET employer_id = NULL WHERE employer_id = 'some-invalid-uuid';

-- Step 4: Verify the fix
SELECT COUNT(*) as contracts_with_valid_fks
FROM contracts c
WHERE (c.client_id IS NULL OR c.client_id IN (SELECT id FROM parties))
  AND (c.employer_id IS NULL OR c.employer_id IN (SELECT id FROM parties))
  AND (c.first_party_id IS NULL OR c.first_party_id IN (SELECT id FROM parties))
  AND (c.second_party_id IS NULL OR c.second_party_id IN (SELECT id FROM parties));
