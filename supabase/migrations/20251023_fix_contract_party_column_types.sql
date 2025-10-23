-- Migration: Fix data type mismatch for first_party_id and second_party_id
-- Date: 2025-10-23
-- Issue: first_party_id and second_party_id are TEXT but should be UUID to match parties table

-- Step 1: Drop dependent views temporarily
DROP VIEW IF EXISTS contracts_needing_promoters CASCADE;

-- Step 2: Check if columns exist and are TEXT type
DO $$
BEGIN
  -- Convert first_party_id from TEXT to UUID if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'first_party_id'
    AND data_type = 'text'
  ) THEN
    -- First, clean any invalid UUIDs (set them to NULL)
    UPDATE contracts 
    SET first_party_id = NULL 
    WHERE first_party_id IS NOT NULL 
    AND first_party_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop the constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'contracts_first_party_id_fkey'
    ) THEN
      ALTER TABLE contracts DROP CONSTRAINT contracts_first_party_id_fkey;
    END IF;
    
    -- Convert column type
    ALTER TABLE contracts 
    ALTER COLUMN first_party_id TYPE UUID USING first_party_id::uuid;
    
    -- Re-add the foreign key constraint
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_first_party_id_fkey 
    FOREIGN KEY (first_party_id) REFERENCES parties(id) ON DELETE SET NULL;
  END IF;

  -- Convert second_party_id from TEXT to UUID if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'second_party_id'
    AND data_type = 'text'
  ) THEN
    -- First, clean any invalid UUIDs (set them to NULL)
    UPDATE contracts 
    SET second_party_id = NULL 
    WHERE second_party_id IS NOT NULL 
    AND second_party_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Drop the constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'contracts_second_party_id_fkey'
    ) THEN
      ALTER TABLE contracts DROP CONSTRAINT contracts_second_party_id_fkey;
    END IF;
    
    -- Convert column type
    ALTER TABLE contracts 
    ALTER COLUMN second_party_id TYPE UUID USING second_party_id::uuid;
    
    -- Re-add the foreign key constraint
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_second_party_id_fkey 
    FOREIGN KEY (second_party_id) REFERENCES parties(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 3: Recreate the contracts_needing_promoters view with proper UUID types
CREATE OR REPLACE VIEW contracts_needing_promoters AS
SELECT 
    c.id,
    c.contract_number,
    c.title,
    c.status,
    c.contract_type,
    c.created_at,
    EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER as days_without_promoter,
    COALESCE(p1.name_en, p1.name_ar, 'Unknown') as first_party_name,
    COALESCE(p2.name_en, p2.name_ar, 'Unknown') as second_party_name,
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 'high'
        WHEN c.status = 'draft' AND EXTRACT(DAY FROM NOW() - c.created_at) > 7 THEN 'medium'
        ELSE 'low'
    END as priority
FROM contracts c
LEFT JOIN parties p1 ON (
    c.first_party_id = p1.id OR 
    c.employer_id = p1.id
)
LEFT JOIN parties p2 ON (
    c.second_party_id = p2.id OR 
    c.client_id = p2.id
)
WHERE c.promoter_id IS NULL
ORDER BY 
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 1
        WHEN c.status = 'draft' AND EXTRACT(DAY FROM NOW() - c.created_at) > 7 THEN 2
        ELSE 3
    END,
    c.created_at DESC;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);

-- Verify the data types
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
AND column_name IN ('employer_id', 'client_id', 'first_party_id', 'second_party_id')
ORDER BY column_name;

