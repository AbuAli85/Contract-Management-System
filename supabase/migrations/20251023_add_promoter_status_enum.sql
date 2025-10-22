-- =====================================================
-- Migration: Add Promoter Status Enum
-- Created: 2025-10-23
-- Purpose: Define clear promoter status categories and update schema
-- =====================================================

-- Step 1: Create promoter status enum type
DO $$ 
BEGIN
  -- Check if enum already exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promoter_status_enum') THEN
    CREATE TYPE promoter_status_enum AS ENUM (
      'active',       -- Currently assigned to contracts
      'available',    -- Ready for assignment but not currently assigned
      'on_leave',     -- Temporarily unavailable
      'inactive',     -- Not available for assignments
      'terminated'    -- No longer with company
    );
    
    RAISE NOTICE 'Created promoter_status_enum type';
  ELSE
    RAISE NOTICE 'promoter_status_enum type already exists';
  END IF;
END $$;

-- Step 2: Backup current status values
CREATE TABLE IF NOT EXISTS promoters_status_backup AS
SELECT id, status, created_at as backup_date
FROM promoters
WHERE status IS NOT NULL;

COMMENT ON TABLE promoters_status_backup IS 'Backup of promoter status values before enum migration';

-- Step 3: Add new status_enum column (temporary)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promoters' AND column_name = 'status_enum'
  ) THEN
    ALTER TABLE promoters ADD COLUMN status_enum promoter_status_enum;
    RAISE NOTICE 'Added status_enum column';
  ELSE
    RAISE NOTICE 'status_enum column already exists';
  END IF;
END $$;

-- Step 4: Migrate existing status values to enum
-- Map old text values to new enum values
UPDATE promoters
SET status_enum = CASE 
  WHEN status = 'active' THEN 'active'::promoter_status_enum
  WHEN status = 'inactive' THEN 'inactive'::promoter_status_enum
  WHEN status = 'pending' THEN 'available'::promoter_status_enum
  WHEN status = 'suspended' THEN 'inactive'::promoter_status_enum
  WHEN status = 'terminated' THEN 'terminated'::promoter_status_enum
  WHEN status = 'on_leave' THEN 'on_leave'::promoter_status_enum
  WHEN status = 'available' THEN 'available'::promoter_status_enum
  -- Default for any other values or NULL
  ELSE 'available'::promoter_status_enum
END
WHERE status_enum IS NULL;

-- Step 5: Set default for promoters with NULL status
UPDATE promoters
SET status_enum = 'available'::promoter_status_enum
WHERE status_enum IS NULL;

-- Step 6: Drop old status column (commented out for safety - uncomment when ready)
-- ALTER TABLE promoters DROP COLUMN IF EXISTS status;

-- Step 7: Rename status_enum to status (commented out for safety - uncomment when ready)
-- ALTER TABLE promoters RENAME COLUMN status_enum TO status;

-- Step 8: Add constraints
ALTER TABLE promoters 
  ALTER COLUMN status_enum SET NOT NULL,
  ALTER COLUMN status_enum SET DEFAULT 'available'::promoter_status_enum;

-- Step 9: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_promoters_status_enum ON promoters(status_enum);

-- Step 10: Add helpful comments
COMMENT ON COLUMN promoters.status_enum IS 'Promoter employment status: active (on contracts), available (ready for work), on_leave (temporary absence), inactive (not available), terminated (left company)';

-- Step 11: Create helper view for status statistics
CREATE OR REPLACE VIEW promoter_status_summary AS
SELECT 
  status_enum as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM promoters
GROUP BY status_enum
ORDER BY count DESC;

COMMENT ON VIEW promoter_status_summary IS 'Summary statistics of promoters by status';

-- Step 12: Create function to count promoters with active contracts
CREATE OR REPLACE FUNCTION count_promoters_with_active_contracts()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT promoter_id)::BIGINT
  FROM contracts
  WHERE status = 'active' 
    AND promoter_id IS NOT NULL;
$$;

COMMENT ON FUNCTION count_promoters_with_active_contracts IS 'Counts unique promoters currently assigned to active contracts';

-- Step 13: Create function to get promoter metrics
CREATE OR REPLACE FUNCTION get_promoter_metrics()
RETURNS TABLE (
  total_workforce BIGINT,
  active_on_contracts BIGINT,
  available_for_work BIGINT,
  on_leave BIGINT,
  inactive BIGINT,
  terminated BIGINT,
  utilization_rate NUMERIC,
  compliance_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH status_counts AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status_enum = 'active') as active_status,
      COUNT(*) FILTER (WHERE status_enum = 'available') as available_status,
      COUNT(*) FILTER (WHERE status_enum = 'on_leave') as on_leave_status,
      COUNT(*) FILTER (WHERE status_enum = 'inactive') as inactive_status,
      COUNT(*) FILTER (WHERE status_enum = 'terminated') as terminated_status
    FROM promoters
  ),
  contract_counts AS (
    SELECT COUNT(DISTINCT promoter_id)::BIGINT as on_contracts
    FROM contracts
    WHERE status = 'active' AND promoter_id IS NOT NULL
  ),
  compliance_counts AS (
    SELECT 
      COUNT(*) FILTER (
        WHERE id_card_expiry_date > CURRENT_DATE + INTERVAL '30 days'
          AND passport_expiry_date > CURRENT_DATE + INTERVAL '30 days'
      ) as compliant,
      COUNT(*) as total
    FROM promoters
    WHERE status_enum IN ('active', 'available')
  )
  SELECT 
    sc.total::BIGINT,
    cc.on_contracts,
    sc.available_status::BIGINT,
    sc.on_leave_status::BIGINT,
    sc.inactive_status::BIGINT,
    sc.terminated_status::BIGINT,
    CASE 
      WHEN (sc.active_status + sc.available_status) > 0 
      THEN ROUND(cc.on_contracts * 100.0 / (sc.active_status + sc.available_status), 2)
      ELSE 0
    END as utilization_rate,
    CASE 
      WHEN comp.total > 0 
      THEN ROUND(comp.compliant * 100.0 / comp.total, 2)
      ELSE 0
    END as compliance_rate
  FROM status_counts sc
  CROSS JOIN contract_counts cc
  CROSS JOIN compliance_counts comp;
$$;

COMMENT ON FUNCTION get_promoter_metrics IS 'Returns comprehensive promoter workforce metrics including status breakdown and utilization';

-- Step 14: Grant necessary permissions
GRANT SELECT ON promoter_status_summary TO authenticated;
GRANT EXECUTE ON FUNCTION count_promoters_with_active_contracts TO authenticated;
GRANT EXECUTE ON FUNCTION get_promoter_metrics TO authenticated;

-- =====================================================
-- Migration Notes:
-- =====================================================
-- 
-- IMPORTANT: This migration uses a gradual approach for safety
-- 
-- Current State:
-- - Both 'status' (text) and 'status_enum' (enum) columns exist
-- - Data has been migrated to status_enum
-- - Old status column is preserved for rollback
-- 
-- To Complete Migration (after verification):
-- 1. Verify all applications read from status_enum
-- 2. Uncomment Step 6 to drop old status column
-- 3. Uncomment Step 7 to rename status_enum to status
-- 4. Update application code to use the enum type
-- 
-- Rollback Plan:
-- If issues occur, you can restore from promoters_status_backup
-- 
-- Status Mapping:
-- - 'active' → active (on contracts)
-- - 'inactive' → inactive (not available)
-- - 'pending' → available (ready for assignment)
-- - 'suspended' → inactive (not available)
-- - 'terminated' → terminated (left company)
-- - 'on_leave' → on_leave (temporary absence)
-- - NULL or unknown → available (default)
-- 
-- =====================================================

-- Verification queries:
-- 
-- Check status distribution:
-- SELECT * FROM promoter_status_summary;
-- 
-- Get comprehensive metrics:
-- SELECT * FROM get_promoter_metrics();
-- 
-- Compare old vs new status:
-- SELECT 
--   status as old_status, 
--   status_enum as new_status, 
--   COUNT(*) 
-- FROM promoters 
-- GROUP BY status, status_enum;
-- 
-- =====================================================

