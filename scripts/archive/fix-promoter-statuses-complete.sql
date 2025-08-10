-- Comprehensive fix for promoter status constraint issue
-- This script handles the constraint violation by fixing data first, then adding the constraint

-- Step 1: Check current status values
SELECT 'Current status values:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM promoters 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY status;

SELECT 'NULL statuses:' as info;
SELECT COUNT(*) as null_count 
FROM promoters 
WHERE status IS NULL;

-- Step 2: Fix NULL statuses first
UPDATE promoters SET status = 'active' WHERE status IS NULL;

-- Step 3: Fix any invalid status values
-- Common mappings for invalid statuses
UPDATE promoters SET status = 'pending_approval' WHERE status = 'pending';
UPDATE promoters SET status = 'active' WHERE status = 'approved';
UPDATE promoters SET status = 'inactive' WHERE status IN ('rejected', 'expired', 'cancelled', 'deleted');
UPDATE promoters SET status = 'suspended' WHERE status = 'blocked';
UPDATE promoters SET status = 'terminated' WHERE status = 'fired';

-- Step 4: For any remaining invalid statuses, set them to 'active'
-- This is a catch-all for any other unexpected values
UPDATE promoters SET status = 'active' 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other');

-- Step 5: Verify all statuses are now valid
SELECT 'Verifying all statuses are valid:' as info;
SELECT id, name_en, status 
FROM promoters 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other');

-- Step 6: Final status count
SELECT 'Final status distribution:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM promoters 
GROUP BY status 
ORDER BY status; 