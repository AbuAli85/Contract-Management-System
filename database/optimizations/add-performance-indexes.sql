-- ============================================
-- Performance Optimization Indexes
-- SmartPro Contract Management System
-- ============================================
-- 
-- This script adds indexes to improve query performance
-- across contracts, parties, and promoters tables.
-- 
-- Expected Impact:
-- - Query execution time reduced by 70-90%
-- - Faster filtering and searching
-- - Improved pagination performance
-- - Better support for large datasets
-- 
-- IMPORTANT: Run this during off-peak hours if possible
-- Creating indexes can lock tables temporarily
-- ============================================

-- Check if indexes already exist before creating them
-- This makes the script idempotent (safe to run multiple times)

-- ============================================
-- CONTRACTS TABLE INDEXES
-- ============================================

-- Index for status filtering (most common query)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_status'
    ) THEN
        CREATE INDEX idx_contracts_status ON contracts(status);
        RAISE NOTICE 'Created index: idx_contracts_status';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_status';
    END IF;
END $$;

-- Index for date range queries (start_date, end_date)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_dates'
    ) THEN
        CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
        RAISE NOTICE 'Created index: idx_contracts_dates';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_dates';
    END IF;
END $$;

-- Index for contract_number searches (unique lookups)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_contract_number'
    ) THEN
        CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);
        RAISE NOTICE 'Created index: idx_contracts_contract_number';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_contract_number';
    END IF;
END $$;

-- Composite index for employer/client relationships (RBAC queries)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_parties'
    ) THEN
        CREATE INDEX idx_contracts_parties ON contracts(employer_id, client_id);
        RAISE NOTICE 'Created index: idx_contracts_parties';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_parties';
    END IF;
END $$;

-- Index for first_party_id queries
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_first_party_id'
    ) THEN
        CREATE INDEX idx_contracts_first_party_id ON contracts(first_party_id);
        RAISE NOTICE 'Created index: idx_contracts_first_party_id';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_first_party_id';
    END IF;
END $$;

-- Index for second_party_id queries
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_second_party_id'
    ) THEN
        CREATE INDEX idx_contracts_second_party_id ON contracts(second_party_id);
        RAISE NOTICE 'Created index: idx_contracts_second_party_id';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_second_party_id';
    END IF;
END $$;

-- Index for promoter_id queries
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_promoter_id'
    ) THEN
        CREATE INDEX idx_contracts_promoter_id ON contracts(promoter_id);
        RAISE NOTICE 'Created index: idx_contracts_promoter_id';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_promoter_id';
    END IF;
END $$;

-- Index for created_at (sorting and pagination)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_created_at'
    ) THEN
        CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);
        RAISE NOTICE 'Created index: idx_contracts_created_at';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_created_at';
    END IF;
END $$;

-- Composite index for status + date filtering (common dashboard query)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_status_dates'
    ) THEN
        CREATE INDEX idx_contracts_status_dates ON contracts(status, start_date, end_date);
        RAISE NOTICE 'Created index: idx_contracts_status_dates';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_status_dates';
    END IF;
END $$;

-- Index for is_current flag (active contracts)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexname = 'idx_contracts_is_current'
    ) THEN
        CREATE INDEX idx_contracts_is_current ON contracts(is_current) WHERE is_current = true;
        RAISE NOTICE 'Created index: idx_contracts_is_current';
    ELSE
        RAISE NOTICE 'Index already exists: idx_contracts_is_current';
    END IF;
END $$;

-- ============================================
-- PARTIES TABLE INDEXES
-- ============================================

-- Index for party type filtering
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'parties' 
        AND indexname = 'idx_parties_type'
    ) THEN
        CREATE INDEX idx_parties_type ON parties(type);
        RAISE NOTICE 'Created index: idx_parties_type';
    ELSE
        RAISE NOTICE 'Index already exists: idx_parties_type';
    END IF;
END $$;

-- Index for CRN lookups (unique business identifier)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'parties' 
        AND indexname = 'idx_parties_crn'
    ) THEN
        CREATE INDEX idx_parties_crn ON parties(crn);
        RAISE NOTICE 'Created index: idx_parties_crn';
    ELSE
        RAISE NOTICE 'Index already exists: idx_parties_crn';
    END IF;
END $$;

-- Full-text search index for party names (English)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'parties' 
        AND indexname = 'idx_parties_name_en_search'
    ) THEN
        CREATE INDEX idx_parties_name_en_search ON parties USING gin(to_tsvector('english', name_en));
        RAISE NOTICE 'Created index: idx_parties_name_en_search';
    ELSE
        RAISE NOTICE 'Index already exists: idx_parties_name_en_search';
    END IF;
END $$;

-- ============================================
-- PROMOTERS TABLE INDEXES
-- ============================================

-- Index for status filtering
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'promoters' 
        AND indexname = 'idx_promoters_status'
    ) THEN
        CREATE INDEX idx_promoters_status ON promoters(status);
        RAISE NOTICE 'Created index: idx_promoters_status';
    ELSE
        RAISE NOTICE 'Index already exists: idx_promoters_status';
    END IF;
END $$;

-- Index for ID card number lookups
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'promoters' 
        AND indexname = 'idx_promoters_id_card_number'
    ) THEN
        CREATE INDEX idx_promoters_id_card_number ON promoters(id_card_number);
        RAISE NOTICE 'Created index: idx_promoters_id_card_number';
    ELSE
        RAISE NOTICE 'Index already exists: idx_promoters_id_card_number';
    END IF;
END $$;

-- Index for mobile number lookups
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'promoters' 
        AND indexname = 'idx_promoters_mobile_number'
    ) THEN
        CREATE INDEX idx_promoters_mobile_number ON promoters(mobile_number);
        RAISE NOTICE 'Created index: idx_promoters_mobile_number';
    ELSE
        RAISE NOTICE 'Index already exists: idx_promoters_mobile_number';
    END IF;
END $$;

-- Full-text search index for promoter names (English)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'promoters' 
        AND indexname = 'idx_promoters_name_en_search'
    ) THEN
        CREATE INDEX idx_promoters_name_en_search ON promoters USING gin(to_tsvector('english', name_en));
        RAISE NOTICE 'Created index: idx_promoters_name_en_search';
    ELSE
        RAISE NOTICE 'Index already exists: idx_promoters_name_en_search';
    END IF;
END $$;

-- Index for employer_id (filtering by employer)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'promoters' 
        AND indexname = 'idx_promoters_employer_id'
    ) THEN
        CREATE INDEX idx_promoters_employer_id ON promoters(employer_id);
        RAISE NOTICE 'Created index: idx_promoters_employer_id';
    ELSE
        RAISE NOTICE 'Index already exists: idx_promoters_employer_id';
    END IF;
END $$;

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for role-based queries
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON users(role);
        RAISE NOTICE 'Created index: idx_users_role';
    ELSE
        RAISE NOTICE 'Index already exists: idx_users_role';
    END IF;
END $$;

-- Index for email lookups
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_email'
    ) THEN
        CREATE INDEX idx_users_email ON users(email);
        RAISE NOTICE 'Created index: idx_users_email';
    ELSE
        RAISE NOTICE 'Index already exists: idx_users_email';
    END IF;
END $$;

-- ============================================
-- VERIFICATION & STATISTICS
-- ============================================

-- Display all indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('contracts', 'parties', 'promoters', 'users')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Display table statistics
SELECT 
    schemaname,
    relname as tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE relname IN ('contracts', 'parties', 'promoters', 'users')
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Performance indexes applied successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run ANALYZE to update query planner statistics';
    RAISE NOTICE '2. Monitor query performance';
    RAISE NOTICE '3. Test API endpoints';
    RAISE NOTICE '============================================';
END $$;

-- Update query planner statistics
ANALYZE contracts;
ANALYZE parties;
ANALYZE promoters;
ANALYZE users;

