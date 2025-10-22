-- =====================================================
-- Migration Fix: Complete Promoter Status Data Migration
-- Purpose: Ensure all promoters have a status_enum value
-- =====================================================

-- Step 1: Diagnostic - Check current state
DO $$
DECLARE
  total_promoters INT;
  with_status_enum INT;
  without_status_enum INT;
BEGIN
  SELECT COUNT(*) INTO total_promoters FROM promoters;
  SELECT COUNT(*) INTO with_status_enum FROM promoters WHERE status_enum IS NOT NULL;
  SELECT COUNT(*) INTO without_status_enum FROM promoters WHERE status_enum IS NULL;
  
  RAISE NOTICE '=== Promoter Status Diagnostic ===';
  RAISE NOTICE 'Total promoters: %', total_promoters;
  RAISE NOTICE 'With status_enum: %', with_status_enum;
  RAISE NOTICE 'Without status_enum (NULL): %', without_status_enum;
END $$;

-- Step 2: Show distribution of old status values for NULL status_enum
SELECT 
  COALESCE(status, 'NULL') as old_status,
  COUNT(*) as count
FROM promoters
WHERE status_enum IS NULL
GROUP BY status
ORDER BY count DESC;

-- Step 3: Update NULL status_enum based on old status column
UPDATE promoters
SET status_enum = CASE 
  -- Direct mappings
  WHEN LOWER(status) = 'active' THEN 'active'::promoter_status_enum
  WHEN LOWER(status) = 'available' THEN 'available'::promoter_status_enum
  WHEN LOWER(status) = 'on_leave' THEN 'on_leave'::promoter_status_enum
  WHEN LOWER(status) = 'inactive' THEN 'inactive'::promoter_status_enum
  WHEN LOWER(status) = 'terminated' THEN 'terminated'::promoter_status_enum
  
  -- Fuzzy mappings
  WHEN LOWER(status) = 'pending' THEN 'available'::promoter_status_enum
  WHEN LOWER(status) = 'suspended' THEN 'inactive'::promoter_status_enum
  WHEN LOWER(status) LIKE '%leave%' THEN 'on_leave'::promoter_status_enum
  WHEN LOWER(status) LIKE '%resign%' THEN 'terminated'::promoter_status_enum
  WHEN LOWER(status) LIKE '%termin%' THEN 'terminated'::promoter_status_enum
  
  -- Default: if status is NULL or unknown, set to available
  ELSE 'available'::promoter_status_enum
END
WHERE status_enum IS NULL;

-- Step 4: Verify - all should now have status_enum
SELECT 
  status_enum,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM promoters
GROUP BY status_enum
ORDER BY count DESC;

-- Step 5: Update the get_promoter_metrics function to be more robust
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
      -- Use status_enum, with fallback to status column
      COUNT(*) FILTER (WHERE 
        COALESCE(status_enum::text, LOWER(status)) = 'active'
      ) as active_status,
      COUNT(*) FILTER (WHERE 
        COALESCE(status_enum::text, LOWER(status)) IN ('available', 'pending')
      ) as available_status,
      COUNT(*) FILTER (WHERE 
        COALESCE(status_enum::text, LOWER(status)) = 'on_leave'
      ) as on_leave_status,
      COUNT(*) FILTER (WHERE 
        COALESCE(status_enum::text, LOWER(status)) IN ('inactive', 'suspended')
      ) as inactive_status,
      COUNT(*) FILTER (WHERE 
        COALESCE(status_enum::text, LOWER(status)) = 'terminated'
      ) as terminated_status
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
    WHERE COALESCE(status_enum::text, LOWER(status)) IN ('active', 'available', 'pending')
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

-- Step 6: Verify the updated metrics
SELECT * FROM get_promoter_metrics();

-- Step 7: Create a view to help identify promoters that may need status review
-- Using a simpler approach without JOIN to avoid type casting issues
CREATE OR REPLACE VIEW promoters_status_review AS
SELECT 
  id,
  name_en,
  email,
  status as old_status,
  status_enum as new_status,
  employer_id,
  CASE 
    WHEN status_enum IS NULL THEN '⚠️ Missing status_enum'
    WHEN status IS NULL THEN '⚠️ Missing old status'
    WHEN status IS NOT NULL AND status_enum IS NOT NULL 
         AND LOWER(status) != status_enum::text THEN '⚠️ Status mismatch'
    ELSE '✅ OK'
  END as status_check,
  CASE 
    WHEN status_enum IS NULL THEN 1
    WHEN status IS NOT NULL AND status_enum IS NOT NULL 
         AND LOWER(status) != status_enum::text THEN 2
    ELSE 3
  END as priority
FROM promoters;

COMMENT ON VIEW promoters_status_review IS 'Review promoter status mappings and identify potential issues. Use ORDER BY priority to see issues first.';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check total counts
SELECT 
  'Total Promoters' as metric,
  COUNT(*) as count
FROM promoters
UNION ALL
SELECT 
  'With status_enum',
  COUNT(*)
FROM promoters
WHERE status_enum IS NOT NULL
UNION ALL
SELECT 
  'Without status_enum (NULL)',
  COUNT(*)
FROM promoters
WHERE status_enum IS NULL;

-- Show status distribution
SELECT * FROM promoter_status_summary;

-- Get metrics
SELECT * FROM get_promoter_metrics();

-- Show any promoters that need review
SELECT * FROM promoters_status_review 
WHERE status_check LIKE '⚠️%'
ORDER BY priority
LIMIT 10;

-- =====================================================
-- Notes
-- =====================================================
-- 
-- This migration:
-- 1. Diagnoses the current state
-- 2. Migrates any NULL status_enum values
-- 3. Updates the metrics function to be more robust
-- 4. Creates a review view for data quality checks
-- 
-- After running this, all 114 promoters should have a status_enum value
-- and the metrics should accurately reflect the workforce composition.
-- =====================================================

