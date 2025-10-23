-- Migration: Comprehensive fix for contracts foreign key issues
-- Date: 2025-01-25
-- Description: Fix all foreign key constraint violations in contracts table

-- Step 1: Temporarily disable foreign key constraints
ALTER TABLE contracts DISABLE TRIGGER ALL;

-- Step 2: Clean up invalid foreign key references
-- Fix contracts with invalid client_id references
UPDATE contracts 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
  AND client_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid employer_id references
UPDATE contracts 
SET employer_id = NULL 
WHERE employer_id IS NOT NULL 
  AND employer_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid first_party_id references
UPDATE contracts 
SET first_party_id = NULL 
WHERE first_party_id IS NOT NULL 
  AND first_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid second_party_id references
UPDATE contracts 
SET second_party_id = NULL 
WHERE second_party_id IS NOT NULL 
  AND second_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid promoter_id references
UPDATE contracts 
SET promoter_id = NULL 
WHERE promoter_id IS NOT NULL 
  AND promoter_id NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Step 3: Create missing parties that are commonly referenced
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

-- Step 4: Re-enable foreign key constraints
ALTER TABLE contracts ENABLE TRIGGER ALL;

-- Step 5: Verify the fix worked
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for remaining invalid references
    SELECT COUNT(*) INTO invalid_count
    FROM contracts c
    WHERE (c.client_id IS NOT NULL AND c.client_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.employer_id IS NOT NULL AND c.employer_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.first_party_id IS NOT NULL AND c.first_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.second_party_id IS NOT NULL AND c.second_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL))
       OR (c.promoter_id IS NOT NULL AND c.promoter_id NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL));
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Warning: % contracts still have invalid foreign key references', invalid_count;
    ELSE
        RAISE NOTICE 'Success: All foreign key references are now valid';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE contracts IS 'Contracts table with cleaned foreign key references. Placeholder parties created for data integrity.';
