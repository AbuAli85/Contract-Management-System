-- Test Dashboard API Queries Directly
-- This script tests the exact queries that the dashboard API uses

-- Test 1: Total and active contracts (should be 0)
SELECT 
    'Contracts Query' as test_name,
    COUNT(*) as total_contracts
FROM contracts;

-- Test 2: Total promoters and their status (should be 158)
SELECT 
    'Promoters Query' as test_name,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promoters
FROM promoters;

-- Test 3: Total parties (should be 16)
SELECT 
    'Parties Query' as test_name,
    COUNT(*) as total_parties
FROM parties;

-- Test 4: Pending approvals (should be 0)
SELECT 
    'Pending Approvals Query' as test_name,
    COUNT(*) as pending_contracts
FROM contracts 
WHERE status = 'pending';

-- Test 5: Recent activity (should be 0)
SELECT 
    'Recent Activity Query' as test_name,
    COUNT(*) as recent_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Test 6: Expiring documents
SELECT 
    'Expiring Documents Query' as test_name,
    COUNT(*) as expiring_docs
FROM promoters 
WHERE visa_expiry_date <= NOW() + INTERVAL '100 days'
   OR passport_expiry_date <= NOW() + INTERVAL '210 days';

-- Test 7: Contract status breakdown (should be empty)
SELECT 
    'Contract Status Breakdown' as test_name,
    status,
    COUNT(*) as count
FROM contracts 
WHERE status IN ('active', 'pending', 'completed', 'cancelled')
GROUP BY status
ORDER BY count DESC;

-- Test 8: Monthly statistics (should be empty)
SELECT 
    'Monthly Statistics' as test_name,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Test 9: Promoter statistics with expiring documents
SELECT 
    'Promoter Statistics' as test_name,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promoters,
    COUNT(CASE WHEN visa_expiry_date <= NOW() + INTERVAL '100 days' THEN 1 END) as expiring_visas,
    COUNT(CASE WHEN passport_expiry_date <= NOW() + INTERVAL '210 days' THEN 1 END) as expiring_passports
FROM promoters; 