-- Troubleshooting script for promoter notification day updates
-- This script helps identify and fix any promoters that still have old values

-- ===========================================
-- STEP 1: Check Current State
-- ===========================================

-- Check all promoters and their current notification day values
SELECT 'All promoters with their current notification day values:' as info;
SELECT 
    id,
    name_en,
    status,
    notify_days_before_id_expiry,
    notify_days_before_passport_expiry,
    CASE 
        WHEN notify_days_before_id_expiry = 100 THEN '✅ Correct'
        ELSE '❌ Needs Update'
    END as id_expiry_status,
    CASE 
        WHEN notify_days_before_passport_expiry = 210 THEN '✅ Correct'
        ELSE '❌ Needs Update'
    END as passport_expiry_status
FROM promoters 
ORDER BY name_en;

-- ===========================================
-- STEP 2: Identify Specific Issues
-- ===========================================

-- Check for NULL values
SELECT 'Promoters with NULL notification days:' as info;
SELECT id, name_en, notify_days_before_id_expiry, notify_days_before_passport_expiry
FROM promoters 
WHERE notify_days_before_id_expiry IS NULL 
   OR notify_days_before_passport_expiry IS NULL;

-- Check for old ID expiry values
SELECT 'Promoters with old ID expiry values:' as info;
SELECT id, name_en, notify_days_before_id_expiry
FROM promoters 
WHERE notify_days_before_id_expiry IS NOT NULL 
   AND notify_days_before_id_expiry != 100;

-- Check for old passport expiry values
SELECT 'Promoters with old passport expiry values:' as info;
SELECT id, name_en, notify_days_before_passport_expiry
FROM promoters 
WHERE notify_days_before_passport_expiry IS NOT NULL 
   AND notify_days_before_passport_expiry != 210;

-- ===========================================
-- STEP 3: Force Update All Promoters
-- ===========================================

-- Force update ALL promoters regardless of current values
UPDATE promoters 
SET notify_days_before_id_expiry = 100;

UPDATE promoters 
SET notify_days_before_passport_expiry = 210;

-- ===========================================
-- STEP 4: Verify Updates
-- ===========================================

-- Verify all promoters now have correct values
SELECT 'Verification - All promoters should now have correct values:' as info;
SELECT 
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN notify_days_before_id_expiry = 100 THEN 1 END) as correct_id_expiry,
    COUNT(CASE WHEN notify_days_before_passport_expiry = 210 THEN 1 END) as correct_passport_expiry,
    COUNT(CASE WHEN notify_days_before_id_expiry = 100 AND notify_days_before_passport_expiry = 210 THEN 1 END) as both_correct
FROM promoters;

-- Show any remaining issues (should be 0)
SELECT 'Any remaining issues (should be 0 rows):' as info;
SELECT id, name_en, notify_days_before_id_expiry, notify_days_before_passport_expiry
FROM promoters 
WHERE notify_days_before_id_expiry != 100 
   OR notify_days_before_passport_expiry != 210;

-- Final summary
SELECT 'Final summary:' as info;
SELECT 
    'All promoters updated successfully!' as message,
    COUNT(*) as total_promoters,
    '100' as id_expiry_days,
    '210' as passport_expiry_days
FROM promoters; 