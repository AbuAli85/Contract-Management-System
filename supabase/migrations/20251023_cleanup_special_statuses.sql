-- =====================================================
-- Cleanup Special Status Values
-- Handle non-standard status values discovered after migration
-- =====================================================

-- Show what we're about to change
SELECT 
  'Before Cleanup' as stage,
  status as old_status_value,
  status_enum as current_enum,
  COUNT(*) as count
FROM promoters
WHERE status IN ('?', 'Cancel', 'Office', '?', 'cancel', 'CANCEL')
   OR status LIKE '%?%'
   OR status LIKE '%cancel%'
   OR status LIKE '%office%'
GROUP BY status, status_enum
ORDER BY count DESC;

-- Update special cases with better mappings
UPDATE promoters
SET status_enum = CASE
  -- "Cancel" status should be terminated
  WHEN LOWER(status) = 'cancel' THEN 'terminated'::promoter_status_enum
  
  -- "?" unknown status - keep as available (safe default)
  WHEN status = '?' THEN 'available'::promoter_status_enum
  
  -- "Office" might mean internal/inactive - set to inactive
  -- (change to 'available' if these are working staff)
  WHEN LOWER(status) = 'office' THEN 'inactive'::promoter_status_enum
  
  -- Keep current value if no match
  ELSE status_enum
END
WHERE status IN ('?', 'Cancel', 'Office', 'cancel', 'CANCEL', 'office', 'OFFICE');

-- Show results after cleanup
SELECT 
  'After Cleanup' as stage,
  status as old_status_value,
  status_enum as updated_enum,
  COUNT(*) as count
FROM promoters
WHERE status IN ('?', 'Cancel', 'Office', 'cancel', 'CANCEL', 'office', 'OFFICE')
GROUP BY status, status_enum
ORDER BY count DESC;

-- Update metrics
SELECT 
  '=== UPDATED METRICS ===' as info;

SELECT * FROM get_promoter_metrics();

-- Show status distribution
SELECT 
  '=== STATUS DISTRIBUTION ===' as info;

SELECT * FROM promoter_status_summary;

-- =====================================================
-- Optional: Clean up the old status column
-- =====================================================
-- 
-- If you want to normalize the old status column to match
-- the new enum (for cleaner data), uncomment below:
-- 
-- UPDATE promoters
-- SET status = status_enum::text
-- WHERE status IS NOT NULL AND status_enum IS NOT NULL;
--
-- This will make old_status match new_status in the review view
-- =====================================================

-- Final verification - should show 0 or very few mismatches now
SELECT 
  '=== REMAINING ISSUES ===' as info;

SELECT COUNT(*) as remaining_mismatches
FROM promoters_status_review 
WHERE status_check LIKE '⚠️%';

-- Show any remaining problem records
SELECT * 
FROM promoters_status_review 
WHERE status_check LIKE '⚠️%'
ORDER BY priority
LIMIT 20;

