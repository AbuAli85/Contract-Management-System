-- Fix promoter statuses to match the new constraint
-- This script updates any existing promoters with invalid status values

-- First, let's see what status values currently exist
SELECT DISTINCT status FROM promoters WHERE status IS NOT NULL;

-- Update any invalid status values to 'active' (or another appropriate default)
-- You can modify these mappings as needed

-- If there are any NULL statuses, set them to 'active'
UPDATE promoters SET status = 'active' WHERE status IS NULL;

-- If there are any statuses not in the allowed list, map them to appropriate values
-- Common mappings:
-- 'pending' -> 'pending_approval'
-- 'approved' -> 'active'
-- 'rejected' -> 'inactive'
-- 'expired' -> 'inactive'
-- 'cancelled' -> 'inactive'

-- Example mappings (uncomment and modify as needed):
-- UPDATE promoters SET status = 'pending_approval' WHERE status = 'pending';
-- UPDATE promoters SET status = 'active' WHERE status = 'approved';
-- UPDATE promoters SET status = 'inactive' WHERE status IN ('rejected', 'expired', 'cancelled');

-- After running the updates, verify the constraint works
-- This should not return any rows if all statuses are valid
SELECT id, name_en, status 
FROM promoters 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other'); 