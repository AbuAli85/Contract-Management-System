-- Emergency fix script for promoter relationship (handles audit triggers)
-- Run this in Supabase SQL Editor
-- This script temporarily disables audit triggers to prevent conflicts

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

-- Step 2: Temporarily disable the audit trigger if it exists
DO $$
BEGIN
  -- Disable trigger if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_promoter_change_trigger'
  ) THEN
    ALTER TABLE contracts DISABLE TRIGGER audit_promoter_change_trigger;
    RAISE NOTICE '✅ Temporarily disabled audit trigger';
  END IF;
END $$;

-- Step 3: Drop the problematic audit function and trigger
DROP TRIGGER IF EXISTS audit_promoter_change_trigger ON contracts;
DROP FUNCTION IF EXISTS audit_promoter_change() CASCADE;
-- Note: Old audit trigger and function removed

-- Step 4: Check current state (with type-safe comparison)
SELECT 
  'Total contracts' AS metric,
  COUNT(*) AS count
FROM contracts
UNION ALL
SELECT 
  'Contracts with promoter_id' AS metric,
  COUNT(*) AS count
FROM contracts
WHERE promoter_id IS NOT NULL;

-- Step 5: Clean up orphaned references (with type-safe comparison)
UPDATE contracts
SET promoter_id = NULL
WHERE promoter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM promoters p WHERE p.id::text = promoter_id::text
  );

-- Step 6: Drop existing foreign key constraint if any
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;

-- Step 7: Ensure column types match (automatic type conversion)
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

-- Step 8: Fix the audit table if it exists
DO $$
DECLARE
  promoter_id_type TEXT;
BEGIN
  -- Check if audit table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_promoter_audit'
  ) THEN
    SELECT data_type INTO promoter_id_type
    FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'promoter_id';
    
    RAISE NOTICE 'Fixing audit table column types...';
    
    -- Update audit table column types to match
    IF promoter_id_type = 'uuid' THEN
      ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE uuid USING old_promoter_id::uuid,
        ALTER COLUMN new_promoter_id TYPE uuid USING new_promoter_id::uuid;
    ELSIF promoter_id_type = 'text' THEN
      ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE text USING old_promoter_id::text,
        ALTER COLUMN new_promoter_id TYPE text USING new_promoter_id::text;
    END IF;
    
    RAISE NOTICE '✅ Fixed audit table column types';
  END IF;
END $$;

-- Step 9: Recreate the audit function with proper types (if audit table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_promoter_audit'
  ) THEN
    -- Create improved audit function
    CREATE OR REPLACE FUNCTION audit_promoter_change()
    RETURNS TRIGGER AS $func$
    BEGIN
      -- Only audit if promoter_id actually changed
      IF OLD.promoter_id IS DISTINCT FROM NEW.promoter_id THEN
        INSERT INTO contract_promoter_audit (
          contract_id,
          old_promoter_id,
          new_promoter_id,
          change_reason,
          changed_at
        ) VALUES (
          NEW.id,
          OLD.promoter_id,
          NEW.promoter_id,
          'Automatic audit: promoter changed',
          NOW()
        );
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Recreate trigger
    DROP TRIGGER IF EXISTS audit_promoter_change_trigger ON contracts;
    CREATE TRIGGER audit_promoter_change_trigger
      AFTER UPDATE ON contracts
      FOR EACH ROW
      WHEN (OLD.promoter_id IS DISTINCT FROM NEW.promoter_id)
      EXECUTE FUNCTION audit_promoter_change();
    
    RAISE NOTICE '✅ Recreated audit trigger with proper type handling';
  END IF;
END $$;

-- Step 10: Add proper foreign key constraint
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Step 11: Create index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);

-- Step 12: Verify the fix
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

-- Step 13: Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'contracts'
  AND trigger_name LIKE '%audit%';

-- Success message
SELECT '✅ Foreign key constraint added successfully with audit support!' AS status;

