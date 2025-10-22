-- =====================================================
-- Verification Script: Contract Performance Indexes
-- =====================================================
-- This script verifies that all performance indexes
-- were created successfully and are being used correctly
-- =====================================================

\echo '======================================'
\echo 'Contract Performance Indexes Verification'
\echo '======================================'
\echo ''

-- 1. List all indexes on contracts table
\echo '1. All Indexes on Contracts Table:'
\echo '-------------------------------------'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'contracts'
ORDER BY indexname;

\echo ''
\echo '2. Index Usage Statistics:'
\echo '-------------------------------------'
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'contracts'
ORDER BY idx_scan DESC;

\echo ''
\echo '3. Table Statistics:'
\echo '-------------------------------------'
-- Check table statistics
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE tablename = 'contracts';

\echo ''
\echo '4. Test Query Plan - Pending Contracts:'
\echo '-------------------------------------'
-- Test pending contracts query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT * FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
ORDER BY created_at DESC 
LIMIT 20;

\echo ''
\echo '5. Test Query Plan - Status Filter:'
\echo '-------------------------------------'
-- Test single status query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT * FROM contracts 
WHERE status = 'pending'
ORDER BY created_at DESC 
LIMIT 20;

\echo ''
\echo '6. Required Indexes Check:'
\echo '-------------------------------------'
-- Check that all required indexes exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_status') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_status' as status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_status_created_at') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_status_created_at'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_status_updated_at') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_status_updated_at'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_first_party_id') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_first_party_id'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_second_party_id') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_second_party_id'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_promoter_id') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_promoter_id'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_composite_parties') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_composite_parties'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contracts' AND indexname = 'idx_contracts_composite_status_dates') 
    THEN '✓' 
    ELSE '✗' 
  END || ' idx_contracts_composite_status_dates';

\echo ''
\echo '7. Performance Summary:'
\echo '-------------------------------------'
-- Count contracts by status
SELECT 
  status,
  COUNT(*) as count
FROM contracts
GROUP BY status
ORDER BY count DESC;

\echo ''
\echo '======================================'
\echo 'Verification Complete!'
\echo '======================================'
\echo ''
\echo 'Expected Results:'
\echo '- All required indexes should show ✓'
\echo '- Query plans should show "Index Scan" (not "Seq Scan")'
\echo '- Query execution time should be < 100ms'
\echo ''
\echo 'If any checks fail, review the migration file and try again.'
\echo ''

