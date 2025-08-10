-- Test Dashboard API Endpoints
-- This script helps diagnose why the dashboard is not showing data

-- Test 1: Check if all required tables exist
SELECT 
    'Table Existence Check' as test_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contracts') as contracts_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'promoters') as promoters_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'parties') as parties_exists;

-- Test 2: Check table row counts
SELECT 
    'Table Row Counts' as test_name,
    (SELECT COUNT(*) FROM contracts) as contracts_count,
    (SELECT COUNT(*) FROM promoters) as promoters_count,
    (SELECT COUNT(*) FROM parties) as parties_count;

-- Test 3: Check contracts status breakdown (what the dashboard API queries)
SELECT 
    'Contracts Status Breakdown' as test_name,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

-- Test 4: Check promoters status breakdown
SELECT 
    'Promoters Status Breakdown' as test_name,
    status,
    COUNT(*) as count
FROM promoters 
GROUP BY status
ORDER BY count DESC;

-- Test 5: Check for recent activity (last 7 days)
SELECT 
    'Recent Activity (Last 7 Days)' as test_name,
    COUNT(*) as recent_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Test 6: Check for pending approvals
SELECT 
    'Pending Approvals' as test_name,
    COUNT(*) as pending_contracts
FROM contracts 
WHERE status = 'pending';

-- Test 7: Check for expiring documents
SELECT 
    'Expiring Documents' as test_name,
    COUNT(*) as expiring_ids
FROM promoters 
WHERE visa_expiry_date <= NOW() + INTERVAL '30 days'
   OR passport_expiry_date <= NOW() + INTERVAL '30 days';

-- Test 8: Check monthly statistics (last 6 months)
SELECT 
    'Monthly Statistics (Last 6 Months)' as test_name,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contracts,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Test 9: Check if there are any data issues
SELECT 
    'Data Quality Check' as test_name,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_contracts,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at_contracts
FROM contracts;

-- Test 10: Check promoter data quality
SELECT 
    'Promoter Data Quality Check' as test_name,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_promoters,
    COUNT(CASE WHEN name_en IS NULL OR name_en = '' THEN 1 END) as empty_name_promoters
FROM promoters;

-- Test 11: Check if the schema cache issue affects these queries
SELECT 
    'Schema Cache Test - Promoters' as test_name,
    COUNT(*) as total_promoters,
    COUNT(employer_id) as promoters_with_employer,
    COUNT(outsourced_to_id) as promoters_with_outsourced_to
FROM promoters;

-- Test 12: Check if there are any permission issues
SELECT 
    'Permission Check' as test_name,
    current_user as current_user,
    session_user as session_user;

-- Test 13: Check table structure for dashboard queries
SELECT 
    'Table Structure Check' as test_name,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('contracts', 'promoters', 'parties')
  AND column_name IN ('id', 'status', 'created_at', 'name_en', 'employer_id', 'outsourced_to_id')
ORDER BY table_name, ordinal_position; 