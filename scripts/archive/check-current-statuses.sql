-- Check current status values in the promoters table
-- Run this first to see what status values exist

SELECT DISTINCT status, COUNT(*) as count 
FROM promoters 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY status;

-- Also check for NULL statuses
SELECT COUNT(*) as null_count 
FROM promoters 
WHERE status IS NULL;

-- Check for any statuses that would violate the new constraint
SELECT id, name_en, status 
FROM promoters 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other')
   OR status IS NULL; 