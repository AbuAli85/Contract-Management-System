-- Emergency fix script for promoter relationship
-- Run this in Supabase SQL Editor if migration fails
-- This script is idempotent and safe to run multiple times

-- Step 1: Check data types first
SELECT 
  'contracts.promoter_id' AS column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'contracts' AND column_name = 'promoter_id'
UNION ALL
SELECT 
  'promoters.id' AS column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'promoters' AND column_name = 'id';

-- Step 2: Check current state (with type-safe comparison)
SELECT 
  'Total contracts' AS metric,
  COUNT(*) AS count
FROM contracts
UNION ALL
SELECT 
  'Contracts with promoter_id' AS metric,
  COUNT(*) AS count
FROM contracts
WHERE promoter_id IS NOT NULL
UNION ALL
SELECT 
  'Valid promoter references (text cast)' AS metric,
  COUNT(*) AS count
FROM contracts c
WHERE c.promoter_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM promoters p WHERE p.id::text = c.promoter_id::text);

-- Step 3: Clean up orphaned references (with type-safe comparison)
UPDATE contracts
SET promoter_id = NULL
WHERE promoter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM promoters p WHERE p.id::text = promoter_id::text
  );

-- Step 4: Drop existing constraint if any
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;

-- Step 5: Ensure column types match
DO $$
DECLARE
  promoter_id_type TEXT;
  promoters_id_type TEXT;
BEGIN
  SELECT data_type INTO promoter_id_type
  FROM information_schema.columns
  WHERE table_name = 'contracts' AND column_name = 'promoter_id';
  
  SELECT data_type INTO promoters_id_type
  FROM information_schema.columns
  WHERE table_name = 'promoters' AND column_name = 'id';
  
  RAISE NOTICE 'Current types: contracts.promoter_id = %, promoters.id = %', promoter_id_type, promoters_id_type;
  
  -- Convert if types don't match
  IF promoter_id_type != promoters_id_type THEN
    RAISE NOTICE 'Type mismatch detected - converting...';
    
    IF promoters_id_type = 'uuid' THEN
      -- Convert promoter_id to UUID
      ALTER TABLE contracts ALTER COLUMN promoter_id TYPE uuid USING promoter_id::uuid;
      RAISE NOTICE '✅ Converted contracts.promoter_id to UUID';
    ELSIF promoters_id_type = 'text' OR promoters_id_type = 'character varying' THEN
      -- Convert promoter_id to TEXT
      ALTER TABLE contracts ALTER COLUMN promoter_id TYPE text USING promoter_id::text;
      RAISE NOTICE '✅ Converted contracts.promoter_id to TEXT';
    END IF;
  ELSE
    RAISE NOTICE '✅ Column types already match';
  END IF;
END $$;

-- Step 6: Add proper foreign key constraint
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Step 7: Create index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);

-- Step 8: Verify the fix
SELECT 
  c.id,
  c.contract_number,
  c.promoter_id,
  p.name_en AS promoter_name,
  p.name_ar AS promoter_name_ar
FROM contracts c
LEFT JOIN promoters p ON c.promoter_id = p.id
WHERE c.promoter_id IS NOT NULL
LIMIT 10;

-- Success message
SELECT '✅ Foreign key constraint added successfully!' AS status;

