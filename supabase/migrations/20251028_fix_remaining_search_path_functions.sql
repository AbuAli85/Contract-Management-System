-- ================================================================
-- Migration: Fix Remaining Function Search Paths
-- Date: 2025-10-28
-- Purpose: Fix the last 3 functions with mutable search_path warnings
-- ================================================================
-- This migration adds `SET search_path = public, pg_catalog` to the
-- remaining trigger functions that were created in scripts:
-- - update_promoter_documents_updated_at
-- - update_promoter_notifications_updated_at
-- - update_promoter_communications_updated_at
-- ================================================================

-- ================================================================
-- PART 1: UPDATE PROMOTER DOCUMENTS TRIGGER
-- ================================================================

CREATE OR REPLACE FUNCTION update_promoter_documents_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 2: UPDATE PROMOTER NOTIFICATIONS TRIGGER
-- ================================================================

CREATE OR REPLACE FUNCTION update_promoter_notifications_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 3: UPDATE PROMOTER COMMUNICATIONS TRIGGER
-- ================================================================

CREATE OR REPLACE FUNCTION update_promoter_communications_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All remaining 3 trigger functions updated with SET search_path!';
  RAISE NOTICE 'Functions fixed:';
  RAISE NOTICE '  1. update_promoter_documents_updated_at';
  RAISE NOTICE '  2. update_promoter_notifications_updated_at';
  RAISE NOTICE '  3. update_promoter_communications_updated_at';
  RAISE NOTICE '';
  RAISE NOTICE 'Combined with previous migration (20251026_fix_function_search_paths.sql),';
  RAISE NOTICE 'all 29 functions should now have immutable search_path!';
  RAISE NOTICE '';
  RAISE NOTICE 'Run: supabase db lint';
  RAISE NOTICE 'to verify all search_path warnings are resolved.';
END $$;

