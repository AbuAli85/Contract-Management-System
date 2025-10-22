-- FINAL SIMPLE FIX for promoter relationship
-- This script has NO RAISE NOTICE statements outside DO blocks
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check current data types
-- ============================================================================
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

-- ============================================================================
-- STEP 2: Disable and remove audit triggers
-- ============================================================================
DO $$
BEGIN
  -- Disable trigger if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_promoter_change_trigger'
  ) THEN
    EXECUTE 'ALTER TABLE contracts DISABLE TRIGGER audit_promoter_change_trigger';
    RAISE NOTICE '✅ Disabled audit trigger';
  ELSE
    RAISE NOTICE 'ℹ️  No audit trigger found';
  END IF;
END $$;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS audit_promoter_change_trigger ON contracts;
DROP FUNCTION IF EXISTS audit_promoter_change() CASCADE;

-- ============================================================================
-- STEP 3: Check current state
-- ============================================================================
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

-- ============================================================================
-- STEP 4: Clean up orphaned references (type-safe)
-- ============================================================================
UPDATE contracts
SET promoter_id = NULL
WHERE promoter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM promoters p WHERE p.id::text = promoter_id::text
  );

-- ============================================================================
-- STEP 5: Drop existing foreign key constraint
-- ============================================================================
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;

-- ============================================================================
-- STEP 6: Fix column types to match
-- ============================================================================
DO $$
DECLARE
  promoter_id_type TEXT;
  promoters_id_type TEXT;
BEGIN
  -- Get current types
  SELECT data_type INTO promoter_id_type
  FROM information_schema.columns
  WHERE table_name = 'contracts' AND column_name = 'promoter_id';
  
  SELECT data_type INTO promoters_id_type
  FROM information_schema.columns
  WHERE table_name = 'promoters' AND column_name = 'id';
  
  RAISE NOTICE 'Current types: contracts.promoter_id = %, promoters.id = %', 
    promoter_id_type, promoters_id_type;
  
  -- Convert if types don't match
  IF promoter_id_type != promoters_id_type THEN
    RAISE NOTICE 'Type mismatch detected - converting...';
    
    IF promoters_id_type = 'uuid' THEN
      -- Convert promoter_id to UUID
      EXECUTE 'ALTER TABLE contracts ALTER COLUMN promoter_id TYPE uuid USING promoter_id::uuid';
      RAISE NOTICE '✅ Converted contracts.promoter_id to UUID';
    ELSIF promoters_id_type IN ('text', 'character varying') THEN
      -- Convert promoter_id to TEXT
      EXECUTE 'ALTER TABLE contracts ALTER COLUMN promoter_id TYPE text USING promoter_id::text';
      RAISE NOTICE '✅ Converted contracts.promoter_id to TEXT';
    END IF;
  ELSE
    RAISE NOTICE '✅ Column types already match';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Fix audit table if it exists
-- ============================================================================
DO $$
DECLARE
  promoter_id_type TEXT;
BEGIN
  -- Check if audit table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_promoter_audit'
  ) THEN
    -- Get the type we need to match
    SELECT data_type INTO promoter_id_type
    FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'promoter_id';
    
    RAISE NOTICE 'Fixing audit table column types to match: %', promoter_id_type;
    
    -- Update audit table column types
    IF promoter_id_type = 'uuid' THEN
      EXECUTE 'ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE uuid USING old_promoter_id::uuid,
        ALTER COLUMN new_promoter_id TYPE uuid USING new_promoter_id::uuid';
      RAISE NOTICE '✅ Audit table columns converted to UUID';
    ELSIF promoter_id_type IN ('text', 'character varying') THEN
      EXECUTE 'ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE text USING old_promoter_id::text,
        ALTER COLUMN new_promoter_id TYPE text USING new_promoter_id::text';
      RAISE NOTICE '✅ Audit table columns converted to TEXT';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  No audit table found - skipping';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Recreate audit trigger if audit table exists
-- ============================================================================
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
    
    -- Create trigger
    DROP TRIGGER IF EXISTS audit_promoter_change_trigger ON contracts;
    CREATE TRIGGER audit_promoter_change_trigger
      AFTER UPDATE ON contracts
      FOR EACH ROW
      WHEN (OLD.promoter_id IS DISTINCT FROM NEW.promoter_id)
      EXECUTE FUNCTION audit_promoter_change();
    
    RAISE NOTICE '✅ Audit trigger recreated';
  ELSE
    RAISE NOTICE 'ℹ️  No audit table - no trigger needed';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Add foreign key constraint
-- ============================================================================
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 10: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);

-- ============================================================================
-- STEP 11: Verify the fix
-- ============================================================================
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

-- ============================================================================
-- STEP 12: Final status check
-- ============================================================================
DO $$
DECLARE
  fk_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Check foreign key
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contracts_promoter_id_fkey'
      AND table_name = 'contracts'
  ) INTO fk_exists;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_promoter_change_trigger'
  ) INTO trigger_exists;
  
  IF fk_exists THEN
    RAISE NOTICE '✅ Foreign key constraint: EXISTS';
  ELSE
    RAISE NOTICE '❌ Foreign key constraint: MISSING';
  END IF;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Audit trigger: EXISTS';
  ELSE
    RAISE NOTICE 'ℹ️  Audit trigger: NOT NEEDED (no audit table)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MIGRATION COMPLETE!';
  RAISE NOTICE '';
END $$;

-- Success message
SELECT '✅ Foreign key constraint added successfully!' AS status;

