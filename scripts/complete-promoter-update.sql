-- Complete promoter update script
-- This script:
-- 1. Fixes status constraint issues
-- 2. Updates notification days for all existing promoters
-- 3. Ensures new promoters will use the correct defaults

-- ===========================================
-- STEP 1: Fix Status Constraint Issues
-- ===========================================

-- Check current status values
SELECT 'Current status values:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM promoters 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY status;

-- Fix NULL statuses
UPDATE promoters SET status = 'active' WHERE status IS NULL;

-- Fix invalid status values
UPDATE promoters SET status = 'pending_approval' WHERE status = 'pending';
UPDATE promoters SET status = 'active' WHERE status = 'approved';
UPDATE promoters SET status = 'inactive' WHERE status IN ('rejected', 'expired', 'cancelled', 'deleted');
UPDATE promoters SET status = 'suspended' WHERE status = 'blocked';
UPDATE promoters SET status = 'terminated' WHERE status = 'fired';

-- Catch-all for any other unexpected values
UPDATE promoters SET status = 'active' 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other');

-- ===========================================
-- STEP 2: Update Notification Days
-- ===========================================

-- Show current notification day distribution
SELECT 'Current ID expiry notification days:' as info;
SELECT notify_days_before_id_expiry, COUNT(*) as count 
FROM promoters 
WHERE notify_days_before_id_expiry IS NOT NULL 
GROUP BY notify_days_before_id_expiry 
ORDER BY notify_days_before_id_expiry;

SELECT 'Current passport expiry notification days:' as info;
SELECT notify_days_before_passport_expiry, COUNT(*) as count 
FROM promoters 
WHERE notify_days_before_passport_expiry IS NOT NULL 
GROUP BY notify_days_before_passport_expiry 
ORDER BY notify_days_before_passport_expiry;

-- Update all existing promoters to use new default values
UPDATE promoters 
SET notify_days_before_id_expiry = 100 
WHERE notify_days_before_id_expiry IS NULL 
   OR notify_days_before_id_expiry != 100;

UPDATE promoters 
SET notify_days_before_passport_expiry = 210 
WHERE notify_days_before_passport_expiry IS NULL 
   OR notify_days_before_passport_expiry != 210;

-- ===========================================
-- STEP 3: Handle Database Constraints
-- ===========================================

-- Drop existing constraint if it exists
ALTER TABLE promoters DROP CONSTRAINT IF EXISTS promoters_status_check;

-- Add the new constraint with all supported status values
ALTER TABLE promoters ADD CONSTRAINT promoters_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other'));

-- ===========================================
-- STEP 4: Verification
-- ===========================================

-- Verify status fixes
SELECT 'Final status distribution:' as info;
SELECT DISTINCT status, COUNT(*) as count 
FROM promoters 
GROUP BY status 
ORDER BY status;

-- Verify notification day updates
SELECT 'Final ID expiry notification days:' as info;
SELECT notify_days_before_id_expiry, COUNT(*) as count 
FROM promoters 
GROUP BY notify_days_before_id_expiry 
ORDER BY notify_days_before_id_expiry;

SELECT 'Final passport expiry notification days:' as info;
SELECT notify_days_before_passport_expiry, COUNT(*) as count 
FROM promoters 
GROUP BY notify_days_before_passport_expiry 
ORDER BY notify_days_before_passport_expiry;

-- Final summary
SELECT 'Complete update summary:' as info;
SELECT 
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other') THEN 1 END) as valid_statuses,
    COUNT(CASE WHEN notify_days_before_id_expiry = 100 THEN 1 END) as id_expiry_updated,
    COUNT(CASE WHEN notify_days_before_passport_expiry = 210 THEN 1 END) as passport_expiry_updated
FROM promoters;

-- Check for any remaining issues (should return 0 rows)
SELECT 'Any remaining issues (should be 0 rows):' as info;
SELECT id, name_en, status, notify_days_before_id_expiry, notify_days_before_passport_expiry
FROM promoters 
WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other')
   OR notify_days_before_id_expiry != 100
   OR notify_days_before_passport_expiry != 210; 