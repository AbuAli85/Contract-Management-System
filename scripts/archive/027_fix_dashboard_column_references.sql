-- Fix Dashboard Column References
-- This script helps identify and fix incorrect column references

-- Check what expiry-related columns actually exist
SELECT 
    'Available Expiry Columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'promoters' 
  AND column_name LIKE '%expiry%'
ORDER BY column_name;

-- Test the corrected queries that the dashboard API uses
SELECT 
    'Dashboard Stats Test' as test_name,
    COUNT(*) as total_promoters,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promoters
FROM promoters;

-- Test expiring documents query with correct column names
SELECT 
    'Expiring Documents Test' as test_name,
    COUNT(*) as total_expiring
FROM promoters 
WHERE visa_expiry_date <= NOW() + INTERVAL '100 days'
   OR passport_expiry_date <= NOW() + INTERVAL '210 days';

-- Test contracts queries
SELECT 
    'Contracts Status Test' as test_name,
    status,
    COUNT(*) as count
FROM contracts 
GROUP BY status
ORDER BY count DESC;

-- Test parties query
SELECT 
    'Parties Count Test' as test_name,
    COUNT(*) as total_parties
FROM parties;

-- Test recent activity query
SELECT 
    'Recent Activity Test' as test_name,
    COUNT(*) as recent_contracts
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Test pending approvals query
SELECT 
    'Pending Approvals Test' as test_name,
    COUNT(*) as pending_contracts
FROM contracts 
WHERE status = 'pending';

-- Verify all required columns exist for dashboard functionality
SELECT 
    'Column Existence Check' as test_name,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promoters' AND column_name = 'visa_expiry_date') as has_visa_expiry_date,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promoters' AND column_name = 'passport_expiry_date') as has_passport_expiry_date,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promoters' AND column_name = 'status') as has_status,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status') as contracts_has_status,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'created_at') as contracts_has_created_at; 