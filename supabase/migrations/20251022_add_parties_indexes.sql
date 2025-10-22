-- Add optimized indexes for parties table queries
-- Migration: 20251022_add_parties_indexes.sql
-- Purpose: Optimize parties table for search, filtering, and sorting operations

-- Drop existing indexes that we'll recreate with better configuration
DROP INDEX IF EXISTS idx_parties_name_en;
DROP INDEX IF EXISTS idx_parties_name_en_trgm;
DROP INDEX IF EXISTS idx_parties_name_en_lower;
DROP INDEX IF EXISTS idx_parties_name_ar_lower;
DROP INDEX IF EXISTS idx_parties_name_combined;
DROP INDEX IF EXISTS idx_parties_crn;
DROP INDEX IF EXISTS idx_parties_crn_lower;
DROP INDEX IF EXISTS idx_parties_status;
DROP INDEX IF EXISTS idx_parties_overall_status;
DROP INDEX IF EXISTS idx_parties_type_status;
DROP INDEX IF EXISTS idx_parties_active;
DROP INDEX IF EXISTS idx_parties_created_at_desc;
DROP INDEX IF EXISTS idx_parties_created_at_asc;
DROP INDEX IF EXISTS idx_parties_updated_at_desc;
DROP INDEX IF EXISTS idx_parties_type_created;
DROP INDEX IF EXISTS idx_parties_status_name;
DROP INDEX IF EXISTS idx_parties_type_status_date;
DROP INDEX IF EXISTS idx_parties_active_contracts;
DROP INDEX IF EXISTS idx_parties_contact_email;
DROP INDEX IF EXISTS idx_parties_employers;
DROP INDEX IF EXISTS idx_parties_clients;

-- ============================================================================
-- SEARCH INDEXES
-- ============================================================================

-- Full-text search index for name_en (case-insensitive, with text pattern ops)
-- Supports LIKE, ILIKE, and full-text search operations
CREATE INDEX idx_parties_name_en_trgm ON parties USING gin (name_en gin_trgm_ops);
CREATE INDEX idx_parties_name_en_lower ON parties (LOWER(name_en) text_pattern_ops);

-- Arabic name search index (case-insensitive)
CREATE INDEX idx_parties_name_ar_lower ON parties (LOWER(name_ar) text_pattern_ops) WHERE name_ar IS NOT NULL;

-- Combined name search (useful for queries that search both English and Arabic)
CREATE INDEX idx_parties_name_combined ON parties (LOWER(name_en), LOWER(name_ar));

-- CRN search index (case-insensitive)
CREATE INDEX idx_parties_crn_lower ON parties (LOWER(crn)) WHERE crn IS NOT NULL;

-- ============================================================================
-- FILTERING INDEXES
-- ============================================================================

-- Type filtering (already exists, keep it as is)
-- idx_parties_type ON parties(type) - already exists from previous migration

-- Status filtering - create index for 'status' column (in addition to overall_status)
CREATE INDEX idx_parties_status ON parties (status) WHERE status IS NOT NULL;

-- Overall status index (recreate with better configuration)
CREATE INDEX idx_parties_overall_status ON parties (overall_status);

-- Combined type and status for common filter queries
CREATE INDEX idx_parties_type_status ON parties (type, overall_status) WHERE type IS NOT NULL;

-- Active status filter (common query pattern)
CREATE INDEX idx_parties_active ON parties (overall_status) WHERE overall_status = 'Active';

-- ============================================================================
-- SORTING INDEXES
-- ============================================================================

-- Created at timestamp for date sorting (ascending and descending)
CREATE INDEX idx_parties_created_at_desc ON parties (created_at DESC);
CREATE INDEX idx_parties_created_at_asc ON parties (created_at ASC);

-- Updated at timestamp for recent changes
CREATE INDEX idx_parties_updated_at_desc ON parties (updated_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Filter by type and sort by created date (common pattern)
CREATE INDEX idx_parties_type_created ON parties (type, created_at DESC) WHERE type IS NOT NULL;

-- Filter by status and sort by name (common list view pattern)
CREATE INDEX idx_parties_status_name ON parties (overall_status, name_en);

-- Filter by type, status, and sort by date (comprehensive filter)
CREATE INDEX idx_parties_type_status_date ON parties (type, overall_status, created_at DESC) 
    WHERE type IS NOT NULL;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Active contracts index for queries that filter by contract count
CREATE INDEX idx_parties_active_contracts ON parties (active_contracts) WHERE active_contracts > 0;

-- Contact information for quick lookups
CREATE INDEX idx_parties_contact_email ON parties (LOWER(contact_email)) WHERE contact_email IS NOT NULL;

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Employer parties only (frequently queried)
CREATE INDEX idx_parties_employers ON parties (name_en, created_at DESC) WHERE type = 'Employer';

-- Client parties only (frequently queried)
CREATE INDEX idx_parties_clients ON parties (name_en, created_at DESC) WHERE type = 'Client';

-- ============================================================================
-- INDEX COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_parties_name_en_trgm IS 'Trigram index for fuzzy name search';
COMMENT ON INDEX idx_parties_name_en_lower IS 'Case-insensitive name search index';
COMMENT ON INDEX idx_parties_name_ar_lower IS 'Arabic name search index';
COMMENT ON INDEX idx_parties_status IS 'Status filtering index';
COMMENT ON INDEX idx_parties_overall_status IS 'Overall status filtering index';
COMMENT ON INDEX idx_parties_created_at_desc IS 'Descending date sort index';
COMMENT ON INDEX idx_parties_type_status IS 'Combined type and status filter';
COMMENT ON INDEX idx_parties_employers IS 'Partial index for Employer parties';
COMMENT ON INDEX idx_parties_clients IS 'Partial index for Client parties';

-- ============================================================================
-- ANALYZE TABLE FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for the query planner to use new indexes efficiently
ANALYZE parties;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Create or replace view to monitor index usage (helpful for future optimization)
CREATE OR REPLACE VIEW parties_index_usage AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'parties'
ORDER BY idx_scan DESC;

COMMENT ON VIEW parties_index_usage IS 'Monitor parties table index usage for optimization';

