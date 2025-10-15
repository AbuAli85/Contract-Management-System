-- Migration: Add performance indexes to promoters table
-- Date: 2025-10-15
-- Description: Create indexes on frequently queried columns for better performance

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index on status column (filtered to exclude nulls)
CREATE INDEX IF NOT EXISTS idx_promoters_status 
ON promoters(status) 
WHERE status IS NOT NULL;

-- Index on employer_id for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_promoters_employer_id 
ON promoters(employer_id) 
WHERE employer_id IS NOT NULL;

-- Index on created_at for time-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_promoters_created_at 
ON promoters(created_at DESC);

-- Index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_promoters_email 
ON promoters(email) 
WHERE email IS NOT NULL;

-- Index on id_card_number for unique checks and searches
CREATE INDEX IF NOT EXISTS idx_promoters_id_card_number 
ON promoters(id_card_number) 
WHERE id_card_number IS NOT NULL;

-- Index on employer_id for user-scoped queries (via employer relationship)
CREATE INDEX IF NOT EXISTS idx_promoters_employer_scoped 
ON promoters(employer_id) 
WHERE employer_id IS NOT NULL;

-- Composite index for common query pattern (status + created_at)
CREATE INDEX IF NOT EXISTS idx_promoters_status_created 
ON promoters(status, created_at DESC) 
WHERE status IS NOT NULL;

-- Composite index for pagination queries
CREATE INDEX IF NOT EXISTS idx_promoters_pagination 
ON promoters(id, created_at DESC);

-- Text search index for name fields using trigram similarity
CREATE INDEX IF NOT EXISTS idx_promoters_name_search 
ON promoters USING gin((
  COALESCE(name_en, '') || ' ' || COALESCE(name_ar, '')
) gin_trgm_ops);

-- Text search index for contact information
CREATE INDEX IF NOT EXISTS idx_promoters_contact_search 
ON promoters USING gin((
  COALESCE(email, '') || ' ' || 
  COALESCE(phone, '') || ' ' || 
  COALESCE(mobile_number, '')
) gin_trgm_ops);

-- Index on expiry dates for document tracking
CREATE INDEX IF NOT EXISTS idx_promoters_id_expiry 
ON promoters(id_card_expiry_date) 
WHERE id_card_expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promoters_passport_expiry 
ON promoters(passport_expiry_date) 
WHERE passport_expiry_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_promoters_status IS 'Improves queries filtering by status';
COMMENT ON INDEX idx_promoters_employer_id IS 'Speeds up foreign key lookups';
COMMENT ON INDEX idx_promoters_created_at IS 'Optimizes time-based sorting';
COMMENT ON INDEX idx_promoters_email IS 'Enables fast email lookups';
COMMENT ON INDEX idx_promoters_id_card_number IS 'Supports unique ID card checks';
COMMENT ON INDEX idx_promoters_employer_scoped IS 'Improves user-scoped queries via employer relationship';
COMMENT ON INDEX idx_promoters_status_created IS 'Composite index for common status + time queries';
COMMENT ON INDEX idx_promoters_pagination IS 'Optimizes pagination performance';
COMMENT ON INDEX idx_promoters_name_search IS 'Enables fast fuzzy name search';
COMMENT ON INDEX idx_promoters_contact_search IS 'Enables search across all contact fields';
COMMENT ON INDEX idx_promoters_id_expiry IS 'Tracks ID card expiration dates';
COMMENT ON INDEX idx_promoters_passport_expiry IS 'Tracks passport expiration dates';

-- Analyze table to update statistics
ANALYZE promoters;

