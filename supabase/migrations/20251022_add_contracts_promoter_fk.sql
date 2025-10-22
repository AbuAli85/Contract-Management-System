-- Migration: Add foreign key constraint for contracts.promoter_id
-- Date: 2025-10-22
-- Purpose: Fix the "N/A" promoter display issue by adding proper foreign key relationship

-- First, verify that all promoter_id values in contracts table reference valid promoters
-- This will help us identify any orphaned records
DO $$
DECLARE
  orphaned_count INTEGER;
  promoter_id_type TEXT;
  promoters_id_type TEXT;
BEGIN
  -- Check the data types of both columns
  SELECT data_type INTO promoter_id_type
  FROM information_schema.columns
  WHERE table_name = 'contracts' AND column_name = 'promoter_id';
  
  SELECT data_type INTO promoters_id_type
  FROM information_schema.columns
  WHERE table_name = 'promoters' AND column_name = 'id';
  
  RAISE NOTICE 'contracts.promoter_id type: %, promoters.id type: %', promoter_id_type, promoters_id_type;
  
  -- Count contracts with promoter_id that don't exist in promoters table
  -- Use explicit casting to handle type mismatches
  IF promoter_id_type = 'uuid' AND promoters_id_type = 'uuid' THEN
    -- Both UUID, no casting needed
    SELECT COUNT(*) INTO orphaned_count
    FROM contracts c
    WHERE c.promoter_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id = c.promoter_id);
  ELSIF promoter_id_type = 'uuid' AND promoters_id_type = 'text' THEN
    -- promoter_id is UUID, promoters.id is text
    SELECT COUNT(*) INTO orphaned_count
    FROM contracts c
    WHERE c.promoter_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id::uuid = c.promoter_id);
  ELSIF promoter_id_type = 'text' AND promoters_id_type = 'uuid' THEN
    -- promoter_id is text, promoters.id is UUID
    SELECT COUNT(*) INTO orphaned_count
    FROM contracts c
    WHERE c.promoter_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id = c.promoter_id::uuid);
  ELSE
    -- Other combinations - try text comparison
    SELECT COUNT(*) INTO orphaned_count
    FROM contracts c
    WHERE c.promoter_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id::text = c.promoter_id::text);
  END IF;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % contracts with invalid promoter_id references', orphaned_count;
    RAISE NOTICE 'These contracts will have their promoter_id set to NULL before adding the foreign key';
    
    -- Set orphaned promoter_id values to NULL (with type handling)
    IF promoter_id_type = 'uuid' AND promoters_id_type = 'uuid' THEN
      UPDATE contracts SET promoter_id = NULL
      WHERE promoter_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id = promoter_id);
    ELSIF promoter_id_type = 'uuid' AND promoters_id_type = 'text' THEN
      UPDATE contracts SET promoter_id = NULL
      WHERE promoter_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id::uuid = promoter_id);
    ELSIF promoter_id_type = 'text' AND promoters_id_type = 'uuid' THEN
      UPDATE contracts SET promoter_id = NULL
      WHERE promoter_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id = promoter_id::uuid);
    ELSE
      UPDATE contracts SET promoter_id = NULL
      WHERE promoter_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM promoters p WHERE p.id::text = promoter_id::text);
    END IF;
    
    RAISE NOTICE 'Cleaned up % orphaned promoter_id references', orphaned_count;
  ELSE
    RAISE NOTICE 'All promoter_id references are valid ✓';
  END IF;
END $$;

-- Drop the constraint if it exists (in case this is a re-run)
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;

-- Add foreign key constraint with ON DELETE SET NULL
-- This ensures that if a promoter is deleted, the contract's promoter_id is set to NULL
-- rather than failing or deleting the contract
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);

-- Verify the constraint was created
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'contracts_promoter_id_fkey'
      AND table_name = 'contracts'
      AND table_schema = 'public'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Foreign key constraint successfully created';
  ELSE
    RAISE EXCEPTION '❌ Failed to create foreign key constraint';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON CONSTRAINT contracts_promoter_id_fkey ON contracts IS 
'Foreign key to promoters table. ON DELETE SET NULL ensures contracts are preserved if promoter is deleted.';

COMMENT ON COLUMN contracts.promoter_id IS 
'UUID reference to the promoter assigned to this contract. Links to promoters.id.';

