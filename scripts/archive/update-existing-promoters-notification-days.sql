-- Update existing promoters with new notification day values
-- This script ensures all existing promoters have the new default values:
-- notify_days_before_id_expiry: 100 (was 30)
-- notify_days_before_passport_expiry: 210 (was 30/60/90)

-- First, let's see the current distribution of notification days
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

-- Update all existing promoters to use the new default values
-- Update ID expiry notification days to 100
UPDATE promoters 
SET notify_days_before_id_expiry = 100 
WHERE notify_days_before_id_expiry IS NULL 
   OR notify_days_before_id_expiry != 100;

-- Update passport expiry notification days to 210
UPDATE promoters 
SET notify_days_before_passport_expiry = 210 
WHERE notify_days_before_passport_expiry IS NULL 
   OR notify_days_before_passport_expiry != 210;

-- Verify the updates
SELECT 'After update - ID expiry notification days:' as info;
SELECT notify_days_before_id_expiry, COUNT(*) as count 
FROM promoters 
GROUP BY notify_days_before_id_expiry 
ORDER BY notify_days_before_id_expiry;

SELECT 'After update - Passport expiry notification days:' as info;
SELECT notify_days_before_passport_expiry, COUNT(*) as count 
FROM promoters 
GROUP BY notify_days_before_passport_expiry 
ORDER BY notify_days_before_passport_expiry;

-- Show a summary of the changes
SELECT 'Summary of updated promoters:' as info;
SELECT 
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN notify_days_before_id_expiry = 100 THEN 1 END) as id_expiry_updated,
    COUNT(CASE WHEN notify_days_before_passport_expiry = 210 THEN 1 END) as passport_expiry_updated
FROM promoters;

-- Show any promoters that might still have old values (should be 0)
SELECT 'Promoters with old ID expiry values (should be 0):' as info;
SELECT id, name_en, notify_days_before_id_expiry 
FROM promoters 
WHERE notify_days_before_id_expiry != 100;

SELECT 'Promoters with old passport expiry values (should be 0):' as info;
SELECT id, name_en, notify_days_before_passport_expiry 
FROM promoters 
WHERE notify_days_before_passport_expiry != 210; 