-- Comprehensive Dashboard Fix Test
-- This script tests all aspects of the dashboard functionality

-- Test 1: Verify all required data exists
SELECT 
    'Data Verification' as test_name,
    (SELECT COUNT(*) FROM promoters) as promoters_count,
    (SELECT COUNT(*) FROM parties) as parties_count,
    (SELECT COUNT(*) FROM contracts) as contracts_count;

-- Test 2: Test promoter status distribution
SELECT 
    'Promoter Status' as test_name,
    status,
    COUNT(*) as count
FROM promoters 
GROUP BY status
ORDER BY count DESC;

-- Test 3: Test exact dashboard API queries
SELECT 
    'Dashboard API Test' as test_name,
    (SELECT COUNT(*) FROM contracts) as total_contracts,
    (SELECT COUNT(*) FROM promoters) as total_promoters,
    (SELECT COUNT(*) FROM parties) as total_parties,
    (SELECT COUNT(*) FROM contracts WHERE status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM contracts WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity;

-- Test 4: Test expiring documents
SELECT 
    'Expiring Documents' as test_name,
    COUNT(*) as expiring_count
FROM promoters 
WHERE visa_expiry_date <= NOW() + INTERVAL '100 days'
   OR passport_expiry_date <= NOW() + INTERVAL '210 days';

-- Test 5: Test active promoters
SELECT 
    'Active Promoters' as test_name,
    COUNT(*) as active_count
FROM promoters 
WHERE status = 'active';

-- Test 6: Test contract status breakdown
SELECT 
    'Contract Status' as test_name,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

-- Test 7: Test monthly statistics
SELECT 
    'Monthly Stats' as test_name,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as count
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Test 8: Test promoter relationships
SELECT 
    'Promoter Relationships' as test_name,
    COUNT(*) as total,
    COUNT(employer_id) as with_employer,
    COUNT(outsourced_to_id) as with_outsourced
FROM promoters; 