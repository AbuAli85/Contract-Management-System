-- Fix Inconsistent Promoter Status Values
-- This script standardizes the status field values

-- =============================================================================
-- CURRENT PROBLEMS IDENTIFIED:
-- =============================================================================
-- - Inconsistent capitalization: "V" vs "v", "Office" vs "office"
-- - Invalid values: "?", "Cancel", "IT", "Office", "V"
-- - Should use standard statuses: active, inactive, terminated, on_leave, suspended

-- =============================================================================
-- STEP 1: Review Current Status Values
-- =============================================================================

SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(DISTINCT name_en, ', ') as example_promoters
FROM promoters
GROUP BY status
ORDER BY count DESC;

-- =============================================================================
-- STEP 2: Standardize Status Values (PREVIEW FIRST!)
-- =============================================================================

-- Preview what changes will be made:
SELECT 
  id,
  name_en,
  status as current_status,
  CASE 
    -- Map ambiguous/invalid statuses to proper values
    WHEN status IN ('active', 'Active') THEN 'active'
    WHEN status IN ('inactive', 'Inactive') THEN 'inactive'
    WHEN status IN ('Cancel', 'Cancelled', 'Canceled', 'terminated', 'Terminated') THEN 'terminated'
    WHEN status IN ('V', 'v', 'Office', 'office', 'IT') THEN 'active' -- Assuming these are active
    WHEN status IN ('?', NULL, '') THEN 'active' -- Default unknown to active
    ELSE 'active' -- Default for any other unexpected values
  END as new_status,
  CASE 
    WHEN status IN ('V', 'v', 'Office', 'office', 'IT') THEN '⚠️ Assumed active - please verify'
    WHEN status IN ('?', NULL, '') THEN '⚠️ Was unknown - defaulted to active'
    WHEN status = 'Cancel' THEN '✓ Mapped to terminated'
    ELSE '✓ Standardized'
  END as change_note
FROM promoters
WHERE status NOT IN ('active', 'inactive', 'terminated', 'on_leave', 'suspended')
   OR status IS NULL
ORDER BY status, name_en;

-- =============================================================================
-- STEP 3: Apply Status Standardization (RUN AFTER REVIEWING PREVIEW!)
-- =============================================================================

/*
-- UNCOMMENT TO RUN:

BEGIN;

UPDATE promoters
SET 
  status = CASE 
    -- Standardize to lowercase proper values
    WHEN status IN ('active', 'Active') THEN 'active'
    WHEN status IN ('inactive', 'Inactive') THEN 'inactive'
    WHEN status IN ('Cancel', 'Cancelled', 'Canceled', 'terminated', 'Terminated') THEN 'terminated'
    WHEN status IN ('V', 'v', 'Office', 'office', 'IT') THEN 'active' -- ⚠️ REVIEW THESE!
    WHEN status IN ('?', NULL, '') THEN 'active' -- ⚠️ REVIEW THESE!
    ELSE 'active'
  END,
  updated_at = NOW()
WHERE status NOT IN ('active', 'inactive', 'terminated', 'on_leave', 'suspended')
   OR status IS NULL
RETURNING id, name_en, status, updated_at;

-- REVIEW THE RESULTS BEFORE COMMITTING!
-- If everything looks good:
COMMIT;

-- If something looks wrong:
-- ROLLBACK;
*/

-- =============================================================================
-- STEP 4: Add Status Constraint (OPTIONAL - Prevents future invalid values)
-- =============================================================================

/*
-- This ensures only valid status values can be inserted/updated
-- UNCOMMENT TO RUN:

ALTER TABLE promoters 
DROP CONSTRAINT IF EXISTS promoters_status_check;

ALTER TABLE promoters
ADD CONSTRAINT promoters_status_check 
CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave', 'suspended', NULL));

-- Test the constraint:
-- This should work:
UPDATE promoters SET status = 'active' WHERE id = 'some-valid-id';

-- This should fail:
-- UPDATE promoters SET status = 'InvalidStatus' WHERE id = 'some-valid-id';
*/

-- =============================================================================
-- STEP 5: Create Status Enum Type (ALTERNATIVE - More robust)
-- =============================================================================

/*
-- If you want even stricter validation, create an enum type:

CREATE TYPE promoter_status AS ENUM (
  'active',
  'inactive', 
  'terminated',
  'on_leave',
  'suspended'
);

-- Then alter the table to use the enum:
-- WARNING: This requires migrating existing data first!
-- ALTER TABLE promoters 
-- ALTER COLUMN status TYPE promoter_status USING status::promoter_status;
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- After running the updates, verify:

-- 1. Check all status values are now standardized
SELECT 
  status,
  COUNT(*) as count
FROM promoters
GROUP BY status
ORDER BY status;

-- Expected output:
-- active     | 94 (or similar)
-- inactive   | 1
-- terminated | 4
-- (no weird values like "?", "V", "Office", etc.)

-- 2. Check for any remaining null or empty statuses
SELECT 
  id,
  name_en,
  status
FROM promoters
WHERE status IS NULL OR TRIM(status) = ''
LIMIT 10;

-- Should return 0 rows

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

/*
RECOMMENDED STATUS VALUES:

- 'active'     : Promoter is currently working/available
- 'inactive'   : Promoter is temporarily not working
- 'terminated' : Employment has ended (permanent)
- 'on_leave'   : Promoter is on approved leave
- 'suspended'  : Promoter is suspended (pending review)

MIGRATION MAPPING USED:
- 'Cancel' → 'terminated'
- 'V', 'v', 'Office', 'office', 'IT' → 'active' (⚠️ verify these)
- '?', NULL, '' → 'active' (⚠️ verify these)

NEXT STEPS:
1. Run the preview query to see what will change
2. Verify the mappings are correct for your business logic
3. Uncomment and run the UPDATE query
4. Verify the results
5. Consider adding the constraint to prevent future invalid values
*/

