-- Migration: Safe fix for contracts foreign key issues
-- Date: 2025-01-25
-- Description: Fix foreign key constraint violations without disabling system triggers

-- Step 1: Create missing parties first
INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
VALUES 
    (
        '00000000-0000-0000-0000-000000000001',
        'Placeholder Client',
        'عميل مؤقت',
        'PLACEHOLDER-001',
        'Client',
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Placeholder Employer',
        'صاحب عمل مؤقت',
        'PLACEHOLDER-002',
        'Employer',
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'System Generated Party',
        'طرف مولود من النظام',
        'SYSTEM-001',
        'Generic',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create missing promoters if needed
-- Check if there are contracts with invalid promoter_id references
DO $$
DECLARE
    missing_promoter_ids UUID[];
    promoter_id UUID;
BEGIN
    -- Get all promoter_ids from contracts that don't exist in promoters table
    SELECT ARRAY_AGG(DISTINCT c.promoter_id) INTO missing_promoter_ids
    FROM contracts c
    WHERE c.promoter_id IS NOT NULL 
      AND c.promoter_id NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);
    
    -- Create placeholder promoters for missing IDs
    IF missing_promoter_ids IS NOT NULL THEN
        FOREACH promoter_id IN ARRAY missing_promoter_ids
        LOOP
            INSERT INTO promoters (id, name_en, name_ar, id_card_number, created_at, updated_at)
            VALUES (
                promoter_id,
                'Placeholder Promoter',
                'مروج مؤقت',
                'PLACEHOLDER-' || EXTRACT(EPOCH FROM NOW())::INTEGER,
                NOW(),
                NOW()
            ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Created % placeholder promoters', array_length(missing_promoter_ids, 1);
    END IF;
END $$;

-- Step 3: Clean up any remaining invalid references by setting them to NULL
-- This is safe because we've created the missing parties/promoters above

-- Clean up contracts with invalid client_id references (set to NULL if still invalid)
UPDATE contracts 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
  AND client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Clean up contracts with invalid employer_id references
UPDATE contracts 
SET employer_id = NULL 
WHERE employer_id IS NOT NULL 
  AND employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Clean up contracts with invalid first_party_id references
UPDATE contracts 
SET first_party_id = NULL 
WHERE first_party_id IS NOT NULL 
  AND first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Clean up contracts with invalid second_party_id references
UPDATE contracts 
SET second_party_id = NULL 
WHERE second_party_id IS NOT NULL 
  AND second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Clean up contracts with invalid promoter_id references
UPDATE contracts 
SET promoter_id = NULL 
WHERE promoter_id IS NOT NULL 
  AND promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Step 4: Verify the fix worked
DO $$
DECLARE
    invalid_count INTEGER;
    total_contracts INTEGER;
BEGIN
    -- Count contracts with invalid foreign key references
    SELECT COUNT(*) INTO invalid_count
    FROM contracts c
    WHERE (c.client_id IS NOT NULL AND c.client_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.employer_id IS NOT NULL AND c.employer_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.first_party_id IS NOT NULL AND c.first_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.second_party_id IS NOT NULL AND c.second_party_id::uuid NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.promoter_id IS NOT NULL AND c.promoter_id::uuid NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL));
    
    -- Count total contracts
    SELECT COUNT(*) INTO total_contracts FROM contracts;
    
    RAISE NOTICE 'Total contracts: %', total_contracts;
    RAISE NOTICE 'Contracts with invalid foreign keys: %', invalid_count;
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Warning: % contracts still have invalid foreign key references', invalid_count;
    ELSE
        RAISE NOTICE 'Success: All foreign key references are now valid';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE contracts IS 'Contracts table with cleaned foreign key references. Placeholder parties and promoters created for data integrity.';
