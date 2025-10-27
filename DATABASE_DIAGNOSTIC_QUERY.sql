-- ============================================================================
-- PROMOTERS TABLE DIAGNOSTIC QUERY
-- Run this in Supabase SQL Editor to diagnose the 81 vs 181 discrepancy
-- ============================================================================

-- Query 1: Total Promoters Count
SELECT 
  'Total Promoters' as metric,
  COUNT(*) as count
FROM promoters;

-- Query 2: Promoters by Status (both fields)
SELECT 
  'Status Breakdown' as section,
  COALESCE(status_enum::text, 'null') as status_enum_value,
  COALESCE(status, 'null') as status_text_value,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM promoters), 2) as percentage
FROM promoters
GROUP BY status_enum, status
ORDER BY count DESC;

-- Query 3: Combined Status (what the app sees)
SELECT 
  'Combined Status View' as section,
  CASE 
    WHEN status_enum IS NOT NULL THEN status_enum::text
    WHEN status IS NOT NULL THEN status
    ELSE 'NULL_STATUS'
  END as effective_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM promoters), 2) as percentage
FROM promoters
GROUP BY effective_status
ORDER BY count DESC;

-- Query 4: Check for NULL status promoters
SELECT 
  'NULL Status Check' as metric,
  COUNT(*) as count
FROM promoters
WHERE status IS NULL AND status_enum IS NULL;

-- Query 5: Status mapped to application categories
SELECT 
  'Application Status Mapping' as section,
  CASE 
    WHEN LOWER(COALESCE(status_enum::text, status)) = 'active' THEN 'ACTIVE'
    WHEN LOWER(COALESCE(status_enum::text, status)) IN ('available', 'pending') THEN 'AVAILABLE'
    WHEN LOWER(COALESCE(status_enum::text, status)) IN ('on_leave', 'leave') THEN 'ON_LEAVE'
    WHEN LOWER(COALESCE(status_enum::text, status)) IN ('inactive', 'suspended') THEN 'INACTIVE'
    WHEN LOWER(COALESCE(status_enum::text, status)) IN ('terminated', 'resigned') THEN 'TERMINATED'
    ELSE 'UNKNOWN/NULL (defaults to AVAILABLE)'
  END as app_status_category,
  COUNT(*) as count
FROM promoters
GROUP BY app_status_category
ORDER BY count DESC;

-- Query 6: Find promoters with unexpected status values
SELECT 
  'Unexpected Status Values' as section,
  COALESCE(status_enum::text, status, 'NULL') as status_value,
  COUNT(*) as count
FROM promoters
WHERE LOWER(COALESCE(status_enum::text, status)) NOT IN (
  'active', 'available', 'pending', 
  'on_leave', 'leave', 
  'inactive', 'suspended', 
  'terminated', 'resigned'
)
  OR (status IS NULL AND status_enum IS NULL)
GROUP BY status_value
ORDER BY count DESC;

-- Query 7: Sample promoters with each status type (first 3)
SELECT 
  'Sample Data' as section,
  id,
  COALESCE(first_name || ' ' || last_name, name_en, 'No Name') as promoter_name,
  status_enum,
  status,
  created_at
FROM promoters
ORDER BY 
  CASE 
    WHEN LOWER(COALESCE(status_enum::text, status)) = 'terminated' THEN 1
    WHEN status IS NULL AND status_enum IS NULL THEN 2
    ELSE 3
  END,
  created_at DESC
LIMIT 20;

-- Query 8: Validation Check - Compare total to status sum
WITH status_counts AS (
  SELECT 
    SUM(CASE WHEN LOWER(COALESCE(status_enum::text, status)) = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN LOWER(COALESCE(status_enum::text, status)) IN ('available', 'pending') THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN LOWER(COALESCE(status_enum::text, status)) IN ('on_leave', 'leave') THEN 1 ELSE 0 END) as on_leave,
    SUM(CASE WHEN LOWER(COALESCE(status_enum::text, status)) IN ('inactive', 'suspended') THEN 1 ELSE 0 END) as inactive,
    SUM(CASE WHEN LOWER(COALESCE(status_enum::text, status)) IN ('terminated', 'resigned') THEN 1 ELSE 0 END) as terminated,
    SUM(CASE 
      WHEN LOWER(COALESCE(status_enum::text, status)) NOT IN (
        'active', 'available', 'pending', 'on_leave', 'leave', 
        'inactive', 'suspended', 'terminated', 'resigned'
      ) OR (status IS NULL AND status_enum IS NULL)
      THEN 1 ELSE 0 
    END) as unknown
  FROM promoters
),
totals AS (
  SELECT COUNT(*) as total FROM promoters
)
SELECT 
  'Validation Summary' as check_name,
  t.total as total_promoters,
  s.active,
  s.available,
  s.on_leave,
  s.inactive,
  s.terminated,
  s.unknown,
  (s.active + s.available + s.on_leave + s.inactive + s.terminated + s.unknown) as status_sum,
  CASE 
    WHEN t.total = (s.active + s.available + s.on_leave + s.inactive + s.terminated + s.unknown) 
    THEN '✅ VALID - Totals match'
    ELSE '❌ MISMATCH - ' || (t.total - (s.active + s.available + s.on_leave + s.inactive + s.terminated + s.unknown))::text || ' promoters unaccounted for'
  END as validation_status
FROM status_counts s, totals t;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================
-- 
-- If Query 8 shows MISMATCH:
-- - Check Query 6 for unexpected status values
-- - Check Query 4 for NULL statuses
-- - Check Query 2 for the raw data breakdown
--
-- Expected Results (based on your observation):
-- - Total: 181
-- - Status Sum: Should equal 181 (if getting 85, there's a problem)
--
-- Common Issues:
-- 1. NULL status values being filtered out somewhere
-- 2. Unexpected status values not mapped to categories
-- 3. RLS policies filtering data differently (unlikely in your case)
-- 4. Case sensitivity issues with status values
-- ============================================================================

