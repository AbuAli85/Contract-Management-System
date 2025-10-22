-- =====================================================
-- Migration: Add Performance Indexes for Contracts
-- Description: Add indexes to improve query performance for pending contracts and common filters
-- Date: 2025-10-22
-- =====================================================

-- Drop existing indexes if they exist (idempotent)
DROP INDEX IF EXISTS idx_contracts_status;
DROP INDEX IF EXISTS idx_contracts_status_created_at;
DROP INDEX IF EXISTS idx_contracts_status_updated_at;
DROP INDEX IF EXISTS idx_contracts_first_party_id;
DROP INDEX IF EXISTS idx_contracts_second_party_id;
DROP INDEX IF EXISTS idx_contracts_promoter_id;
DROP INDEX IF EXISTS idx_contracts_client_id;
DROP INDEX IF EXISTS idx_contracts_employer_id;
DROP INDEX IF EXISTS idx_contracts_composite_parties;
DROP INDEX IF EXISTS idx_contracts_composite_status_dates;

-- =====================================================
-- 1. Status Index (Critical for Pending Contracts Page)
-- =====================================================
-- This index is crucial for filtering by status='pending' and related statuses
CREATE INDEX IF NOT EXISTS idx_contracts_status 
ON contracts(status) 
WHERE status IS NOT NULL;

COMMENT ON INDEX idx_contracts_status IS 'Optimize filtering by contract status (pending, active, etc.)';

-- =====================================================
-- 2. Composite Index: Status + Created Date
-- =====================================================
-- Optimizes queries that filter by status and order by created_at (DESC)
CREATE INDEX IF NOT EXISTS idx_contracts_status_created_at 
ON contracts(status, created_at DESC) 
WHERE status IS NOT NULL;

COMMENT ON INDEX idx_contracts_status_created_at IS 'Optimize status filtering with creation date ordering';

-- =====================================================
-- 3. Composite Index: Status + Updated Date
-- =====================================================
-- Optimizes queries that filter by status and order by updated_at (DESC)
CREATE INDEX IF NOT EXISTS idx_contracts_status_updated_at 
ON contracts(status, updated_at DESC) 
WHERE status IS NOT NULL;

COMMENT ON INDEX idx_contracts_status_updated_at IS 'Optimize status filtering with update date ordering';

-- =====================================================
-- 4. Party ID Indexes (for relationship lookups)
-- =====================================================
-- Index on first_party_id for relationship lookups
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id 
ON contracts(first_party_id) 
WHERE first_party_id IS NOT NULL;

COMMENT ON INDEX idx_contracts_first_party_id IS 'Optimize first party relationship lookups';

-- Index on second_party_id for relationship lookups
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id 
ON contracts(second_party_id) 
WHERE second_party_id IS NOT NULL;

COMMENT ON INDEX idx_contracts_second_party_id IS 'Optimize second party relationship lookups';

-- Index on promoter_id for relationship lookups
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id 
ON contracts(promoter_id) 
WHERE promoter_id IS NOT NULL;

COMMENT ON INDEX idx_contracts_promoter_id IS 'Optimize promoter relationship lookups';

-- =====================================================
-- 5. Legacy Column Indexes (for backward compatibility)
-- =====================================================
-- Index on client_id (legacy column)
CREATE INDEX IF NOT EXISTS idx_contracts_client_id 
ON contracts(client_id) 
WHERE client_id IS NOT NULL;

COMMENT ON INDEX idx_contracts_client_id IS 'Optimize client (legacy) relationship lookups';

-- Index on employer_id (legacy column)
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id 
ON contracts(employer_id) 
WHERE employer_id IS NOT NULL;

COMMENT ON INDEX idx_contracts_employer_id IS 'Optimize employer (legacy) relationship lookups';

-- =====================================================
-- 6. Composite Index for User-Specific Queries
-- =====================================================
-- Optimizes queries like: WHERE (first_party_id = X OR second_party_id = X) AND status = Y
-- Note: This uses a functional index with COALESCE to handle OR conditions efficiently
CREATE INDEX IF NOT EXISTS idx_contracts_composite_parties 
ON contracts(first_party_id, second_party_id, status) 
WHERE status IS NOT NULL;

COMMENT ON INDEX idx_contracts_composite_parties IS 'Optimize user-specific contract queries with status filter';

-- =====================================================
-- 7. Composite Index for Dashboard Queries
-- =====================================================
-- Optimizes complex queries that filter by multiple statuses and order by date
CREATE INDEX IF NOT EXISTS idx_contracts_composite_status_dates 
ON contracts(status, created_at DESC, updated_at DESC) 
WHERE status IN ('pending', 'active', 'legal_review', 'hr_review', 'final_approval', 'signature');

COMMENT ON INDEX idx_contracts_composite_status_dates IS 'Optimize dashboard queries with multiple status filters';

-- =====================================================
-- Analyze table to update statistics
-- =====================================================
ANALYZE contracts;

-- =====================================================
-- Verification Query
-- =====================================================
-- To verify indexes were created successfully, run:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename = 'contracts'
-- ORDER BY indexname;

-- =====================================================
-- Performance Testing Queries
-- =====================================================
-- Test query 1: Pending contracts (should use idx_contracts_status_created_at)
-- EXPLAIN ANALYZE
-- SELECT * FROM contracts 
-- WHERE status = 'pending' 
-- ORDER BY created_at DESC 
-- LIMIT 20;

-- Test query 2: User-specific contracts (should use idx_contracts_composite_parties)
-- EXPLAIN ANALYZE
-- SELECT * FROM contracts 
-- WHERE (first_party_id = 'user-id' OR second_party_id = 'user-id') 
-- AND status = 'pending';

-- Test query 3: Multiple status filter (should use idx_contracts_composite_status_dates)
-- EXPLAIN ANALYZE
-- SELECT * FROM contracts 
-- WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
-- ORDER BY created_at DESC 
-- LIMIT 100;

