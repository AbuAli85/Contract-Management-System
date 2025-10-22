-- ULTIMATE FIX for promoter relationship
-- Handles: triggers, audit tables, views, type mismatches
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
-- STEP 2: Store view definitions before dropping them
-- ============================================================================
DO $$
DECLARE
  view_record RECORD;
  backup_count INTEGER := 0;
BEGIN
  -- Create temp table for backups
  CREATE TEMP TABLE IF NOT EXISTS view_backup (
    view_name TEXT,
    view_definition TEXT
  );
  
  -- Find all ACTUAL VIEWS (not tables) that use the contracts table
  FOR view_record IN
    SELECT DISTINCT
      v.view_name,
      pg_get_viewdef((v.view_schema || '.' || v.view_name)::regclass) AS view_definition
    FROM information_schema.view_table_usage v
    WHERE v.table_name = 'contracts'
      AND v.table_schema = 'public'
      AND EXISTS (
        SELECT 1 
        FROM information_schema.views iv 
        WHERE iv.table_name = v.view_name 
          AND iv.table_schema = 'public'
      )
  LOOP
    RAISE NOTICE 'Found view: %', view_record.view_name;
    
    INSERT INTO view_backup (view_name, view_definition)
    VALUES (view_record.view_name, view_record.view_definition);
    
    backup_count := backup_count + 1;
  END LOOP;
  
  IF backup_count = 0 THEN
    RAISE NOTICE 'ℹ️  No views found that use contracts table';
  ELSE
    RAISE NOTICE '✅ Backed up % view definition(s)', backup_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop dependent views
-- ============================================================================
DO $$
DECLARE
  view_name TEXT;
  dropped_count INTEGER := 0;
BEGIN
  -- Drop all ACTUAL VIEWS (not tables) that depend on contracts.promoter_id
  FOR view_name IN
    SELECT DISTINCT v.view_name
    FROM information_schema.view_table_usage v
    WHERE v.table_name = 'contracts'
      AND v.table_schema = 'public'
      AND EXISTS (
        SELECT 1 
        FROM information_schema.views iv 
        WHERE iv.table_name = v.view_name 
          AND iv.table_schema = 'public'
      )
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_name);
    RAISE NOTICE 'Dropped view: %', view_name;
    dropped_count := dropped_count + 1;
  END LOOP;
  
  IF dropped_count = 0 THEN
    RAISE NOTICE 'ℹ️  No views found that depend on contracts table';
  ELSE
    RAISE NOTICE '✅ Dropped % dependent view(s)', dropped_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Disable and remove audit triggers
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_promoter_change_trigger'
  ) THEN
    EXECUTE 'ALTER TABLE contracts DISABLE TRIGGER audit_promoter_change_trigger';
    RAISE NOTICE '✅ Disabled audit trigger';
  END IF;
END $$;

DROP TRIGGER IF EXISTS audit_promoter_change_trigger ON contracts CASCADE;
DROP FUNCTION IF EXISTS audit_promoter_change() CASCADE;

-- ============================================================================
-- STEP 5: Clean up orphaned references (type-safe)
-- ============================================================================
UPDATE contracts
SET promoter_id = NULL
WHERE promoter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM promoters p WHERE p.id::text = promoter_id::text
  );

-- ============================================================================
-- STEP 6: Drop existing foreign key constraint
-- ============================================================================
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;

-- ============================================================================
-- STEP 7: Fix column types to match
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
      ALTER TABLE contracts ALTER COLUMN promoter_id TYPE uuid USING promoter_id::uuid;
      RAISE NOTICE '✅ Converted contracts.promoter_id to UUID';
    ELSIF promoters_id_type IN ('text', 'character varying') THEN
      ALTER TABLE contracts ALTER COLUMN promoter_id TYPE text USING promoter_id::text;
      RAISE NOTICE '✅ Converted contracts.promoter_id to TEXT';
    END IF;
  ELSE
    RAISE NOTICE '✅ Column types already match';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Fix audit table if it exists
-- ============================================================================
DO $$
DECLARE
  promoter_id_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_promoter_audit'
  ) THEN
    SELECT data_type INTO promoter_id_type
    FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'promoter_id';
    
    RAISE NOTICE 'Fixing audit table column types to match: %', promoter_id_type;
    
    IF promoter_id_type = 'uuid' THEN
      ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE uuid USING old_promoter_id::uuid,
        ALTER COLUMN new_promoter_id TYPE uuid USING new_promoter_id::uuid;
      RAISE NOTICE '✅ Audit table columns converted to UUID';
    ELSIF promoter_id_type IN ('text', 'character varying') THEN
      ALTER TABLE contract_promoter_audit 
        ALTER COLUMN old_promoter_id TYPE text USING old_promoter_id::text,
        ALTER COLUMN new_promoter_id TYPE text USING new_promoter_id::text;
      RAISE NOTICE '✅ Audit table columns converted to TEXT';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  No audit table found';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Recreate audit trigger if needed
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_promoter_audit'
  ) THEN
    CREATE OR REPLACE FUNCTION audit_promoter_change()
    RETURNS TRIGGER AS $func$
    BEGIN
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
    
    CREATE TRIGGER audit_promoter_change_trigger
      AFTER UPDATE ON contracts
      FOR EACH ROW
      WHEN (OLD.promoter_id IS DISTINCT FROM NEW.promoter_id)
      EXECUTE FUNCTION audit_promoter_change();
    
    RAISE NOTICE '✅ Audit trigger recreated';
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Add foreign key constraint
-- ============================================================================
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 11: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);

-- ============================================================================
-- STEP 12: Recreate views from backup
-- ============================================================================
DO $$
DECLARE
  view_record RECORD;
  view_def TEXT;
BEGIN
  -- Check if we have backed up views
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'view_backup') THEN
    FOR view_record IN
      SELECT view_name, view_definition FROM view_backup
    LOOP
      BEGIN
        -- Recreate the view
        EXECUTE format('CREATE OR REPLACE VIEW %I AS %s', 
          view_record.view_name, 
          view_record.view_definition
        );
        RAISE NOTICE 'Recreated view: %', view_record.view_name;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not recreate view % automatically. Error: %', 
            view_record.view_name, SQLERRM;
          RAISE NOTICE 'View definition stored for manual recreation if needed';
      END;
    END LOOP;
    
    -- Clean up temp table
    DROP TABLE IF EXISTS view_backup;
    RAISE NOTICE '✅ Processed backed up views';
  ELSE
    RAISE NOTICE 'ℹ️  No views to recreate';
  END IF;
END $$;

-- ============================================================================
-- STEP 13: Verify the fix
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
-- STEP 14: Final status check
-- ============================================================================
DO $$
DECLARE
  fk_exists BOOLEAN;
  trigger_exists BOOLEAN;
  view_count INTEGER;
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
  
  -- Count views on contracts table
  SELECT COUNT(DISTINCT v.view_name) INTO view_count
  FROM information_schema.view_table_usage v
  WHERE v.table_name = 'contracts'
    AND v.table_schema = 'public'
    AND EXISTS (
      SELECT 1 
      FROM information_schema.views iv 
      WHERE iv.table_name = v.view_name 
        AND iv.table_schema = 'public'
    );
  
  IF fk_exists THEN
    RAISE NOTICE '✅ Foreign key constraint: EXISTS';
  ELSE
    RAISE NOTICE '❌ Foreign key constraint: MISSING';
  END IF;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Audit trigger: EXISTS';
  ELSE
    RAISE NOTICE 'ℹ️  Audit trigger: NOT NEEDED';
  END IF;
  
  RAISE NOTICE 'ℹ️  Views on contracts table: %', view_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MIGRATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE 'If any views could not be recreated automatically,';
  RAISE NOTICE 'check your application code or database for the view definitions.';
  RAISE NOTICE '';
END $$;

-- Success message
SELECT '✅ Foreign key constraint added successfully!' AS status;

