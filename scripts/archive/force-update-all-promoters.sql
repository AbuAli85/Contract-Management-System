-- Force update ALL promoters with new notification day values
-- This script will update every promoter regardless of their current values

-- Update ALL promoters to use 100 days for ID expiry
UPDATE promoters 
SET notify_days_before_id_expiry = 100;

-- Update ALL promoters to use 210 days for passport expiry
UPDATE promoters 
SET notify_days_before_passport_expiry = 210;

-- Verify the updates
SELECT 'Verification - All promoters updated:' as info;
SELECT 
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN notify_days_before_id_expiry = 100 THEN 1 END) as id_expiry_100,
    COUNT(CASE WHEN notify_days_before_passport_expiry = 210 THEN 1 END) as passport_expiry_210
FROM promoters;

-- Show final result
SELECT 'All promoters now have:' as info;
SELECT 
    '✅ ID Expiry: 100 days' as setting,
    COUNT(*) as count
FROM promoters 
WHERE notify_days_before_id_expiry = 100
UNION ALL
SELECT 
    '✅ Passport Expiry: 210 days' as setting,
    COUNT(*) as count
FROM promoters 
WHERE notify_days_before_passport_expiry = 210; 