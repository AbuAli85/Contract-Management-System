-- Test Dashboard with No Contracts
-- This script tests the dashboard queries when contracts table is empty

-- Test 1: Check promoters data
SELECT 
    'Promoters Data' as test_name,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promoters,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_promoters
FROM promoters;

-- Test 2: Check parties data
SELECT 
    'Parties Data' as test_name,
    COUNT(*) as total_parties
FROM parties;

-- Test 3: Test contracts queries (should handle empty table)
SELECT 
    'Contracts Data' as test_name,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contracts
FROM contracts;

-- Test 4: Test expiring documents query
SELECT 
    'Expiring Documents' as test_name,
    COUNT(*) as total_expiring
FROM promoters 
WHERE visa_expiry_date <= NOW() + INTERVAL '100 days'
   OR passport_expiry_date <= NOW() + INTERVAL '210 days';

-- Test 5: Test recent activity (should be 0 with no contracts)
SELECT 
    'Recent Activity' as test_name,
    COUNT(*) as recent_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Test 6: Test pending approvals (should be 0 with no contracts)
SELECT 
    'Pending Approvals' as test_name,
    COUNT(*) as pending_contracts
FROM contracts 
WHERE status = 'pending';

-- Test 7: Check promoter status distribution
SELECT 
    'Promoter Status Distribution' as test_name,
    status,
    COUNT(*) as count
FROM promoters 
GROUP BY status
ORDER BY count DESC;

-- Test 8: Check if there are any promoters with employer relationships
SELECT 
    'Promoter Relationships' as test_name,
    COUNT(*) as total_promoters,
    COUNT(employer_id) as promoters_with_employer,
    COUNT(outsourced_to_id) as promoters_with_outsourced_to
FROM promoters; 