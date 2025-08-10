-- Test API Endpoints Directly
-- This script tests the exact queries used by the dashboard API endpoints

-- Test 1: Stats API Query Test
SELECT 
    'Stats API Test' as test_name,
    (SELECT COUNT(*) FROM contracts) as total_contracts,
    (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts,
    (SELECT COUNT(*) FROM contracts WHERE status = 'pending') as pending_contracts,
    (SELECT COUNT(*) FROM contracts WHERE status = 'completed') as completed_contracts,
    (SELECT COUNT(*) FROM promoters) as total_promoters,
    (SELECT COUNT(*) FROM promoters WHERE status = 'active') as active_promoters,
    (SELECT COUNT(*) FROM parties) as total_parties,
    (SELECT COUNT(*) FROM contracts WHERE status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM contracts WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity;

-- Test 2: Notifications API Query Test
SELECT 
    'Notifications API Test' as test_name,
    (SELECT COUNT(*) FROM promoters WHERE visa_expiry_date <= NOW() + INTERVAL '100 days') as expiring_visas,
    (SELECT COUNT(*) FROM promoters WHERE passport_expiry_date <= NOW() + INTERVAL '210 days') as expiring_passports,
    (SELECT COUNT(*) FROM contracts WHERE status = 'pending') as pending_contracts,
    (SELECT COUNT(*) FROM contracts WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_contracts;

-- Test 3: Activities API Query Test
SELECT 
    'Activities API Test' as test_name,
    (SELECT COUNT(*) FROM contracts WHERE created_at >= NOW() - INTERVAL '7 days') as contracts_last_7_days,
    (SELECT COUNT(*) FROM promoters WHERE created_at >= NOW() - INTERVAL '7 days') as promoters_last_7_days,
    (SELECT COUNT(*) FROM parties WHERE created_at >= NOW() - INTERVAL '7 days') as parties_last_7_days;

-- Test 4: Check if any data exists in each table
SELECT 
    'Table Data Check' as test_name,
    (SELECT COUNT(*) FROM contracts) as contracts_count,
    (SELECT COUNT(*) FROM promoters) as promoters_count,
    (SELECT COUNT(*) FROM parties) as parties_count,
    (SELECT COUNT(*) FROM contracts WHERE created_at IS NOT NULL) as contracts_with_dates,
    (SELECT COUNT(*) FROM promoters WHERE created_at IS NOT NULL) as promoters_with_dates,
    (SELECT COUNT(*) FROM parties WHERE created_at IS NOT NULL) as parties_with_dates;

-- Test 5: Check status values in each table
SELECT 
    'Status Distribution' as test_name,
    'contracts' as table_name,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

SELECT 
    'Status Distribution' as test_name,
    'promoters' as table_name,
    status,
    COUNT(*) as count
FROM promoters 
GROUP BY status
ORDER BY count DESC;

SELECT 
    'Status Distribution' as test_name,
    'parties' as table_name,
    type,
    COUNT(*) as count
FROM parties 
GROUP BY type
ORDER BY count DESC; 