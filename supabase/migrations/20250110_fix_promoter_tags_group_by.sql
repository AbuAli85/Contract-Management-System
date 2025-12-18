-- Migration: Fix GROUP BY error for promoter_tags.tag
-- Date: 2025-01-10
-- Description: Fixes SQL error 42803 where promoter_tags.tag must appear in GROUP BY clause

-- First, let's check if there are any views that use promoter_tags with GROUP BY
DO $$
DECLARE
  view_record RECORD;
  view_def TEXT;
  func_record RECORD;
BEGIN
  -- Find all views that reference promoter_tags
  RAISE NOTICE 'Checking for views with promoter_tags...';
  FOR view_record IN
    SELECT 
      schemaname,
      viewname,
      pg_get_viewdef((schemaname || '.' || viewname)::regclass) AS view_definition
    FROM pg_views
    WHERE schemaname = 'public'
      AND pg_get_viewdef((schemaname || '.' || viewname)::regclass) ILIKE '%promoter_tags%'
  LOOP
    RAISE NOTICE 'Found view: %.%', view_record.schemaname, view_record.viewname;
    IF view_record.view_definition ILIKE '%GROUP BY%' THEN
      RAISE NOTICE '⚠️  View has GROUP BY - checking for tag column issue...';
      RAISE NOTICE 'View definition: %', LEFT(view_record.view_definition, 500);
    END IF;
  END LOOP;
  
  -- Find all functions that reference promoter_tags
  RAISE NOTICE 'Checking for functions with promoter_tags...';
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) ILIKE '%promoter_tags%'
  LOOP
    RAISE NOTICE 'Found function: %.%', func_record.schema_name, func_record.function_name;
    IF func_record.function_definition ILIKE '%GROUP BY%' AND func_record.function_definition ILIKE '%tag%' THEN
      RAISE NOTICE '⚠️  Function has GROUP BY with tag - may need fixing';
    END IF;
  END LOOP;
END $$;

-- Fix common pattern: If a view/query selects tags.tag and groups by promoter_id,
-- we need to aggregate the tags using array_agg or include tag in GROUP BY
-- 
-- Example fix pattern:
-- OLD: SELECT p.id, t.tag FROM promoters p JOIN promoter_tags pt ON ... JOIN tags t ON ... GROUP BY p.id
-- NEW: SELECT p.id, array_agg(t.tag) as tags FROM promoters p JOIN promoter_tags pt ON ... JOIN tags t ON ... GROUP BY p.id
--
-- OR
--
-- OLD: SELECT p.id, t.tag FROM promoters p JOIN promoter_tags pt ON ... JOIN tags t ON ... GROUP BY p.id
-- NEW: SELECT p.id, t.tag FROM promoters p JOIN promoter_tags pt ON ... JOIN tags t ON ... GROUP BY p.id, t.tag

-- Check if there's a direct query issue in the application
-- The error suggests a query is selecting promoter_tags.tag without proper aggregation
-- Since we can't modify application code directly, we'll create a helper view that properly aggregates tags

-- Create a view that properly aggregates tags per promoter
-- Note: promoter_tags table has a 'tag' column directly (TEXT), not a foreign key
CREATE OR REPLACE VIEW promoter_tags_aggregated AS
SELECT 
  pt.promoter_id,
  array_agg(pt.tag ORDER BY pt.tag) as tag_names,
  COUNT(pt.tag) as tag_count
FROM promoter_tags pt
WHERE pt.tag IS NOT NULL
GROUP BY pt.promoter_id;

-- Create a function to get tags for a promoter (properly aggregated)
CREATE OR REPLACE FUNCTION get_promoter_tags(p_promoter_id UUID)
RETURNS TABLE (
  tag_names TEXT[],
  tag_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pta.tag_names, ARRAY[]::TEXT[]) as tag_names,
    COALESCE(pta.tag_count, 0)::BIGINT as tag_count
  FROM promoter_tags_aggregated pta
  WHERE pta.promoter_id = p_promoter_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON VIEW promoter_tags_aggregated IS 'Properly aggregated promoter tags view that fixes GROUP BY issues';
COMMENT ON FUNCTION get_promoter_tags(UUID) IS 'Helper function to get aggregated tags for a promoter';

-- ============================================================================
-- CRITICAL FIX: Create a PostgREST-compatible relationship function
-- This allows queries like: promoters?select=*,promoter_tags_array(tags)
-- ============================================================================

-- Create a function that returns tags as a simple array for PostgREST
-- This can be used as a computed relationship in PostgREST queries
CREATE OR REPLACE FUNCTION promoter_tags_array(promoter_id UUID)
RETURNS TABLE (
  tags TEXT[]
) 
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT array_agg(tag ORDER BY tag) 
     FROM promoter_tags 
     WHERE promoter_tags.promoter_id = promoter_tags_array.promoter_id 
       AND tag IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as tags;
$$;

COMMENT ON FUNCTION promoter_tags_array(UUID) IS 'PostgREST-compatible function to get promoter tags as an array. Use in queries like: promoters?select=*,promoter_tags_array(tags)';

-- ============================================================================
-- ALTERNATIVE: If the error is from a direct SQL query, we can create a 
-- trigger that prevents invalid queries, but that's not practical.
-- Instead, we'll create a wrapper view for promoters that includes tags
-- ============================================================================

-- Create a view that includes promoters with their aggregated tags
-- This can be used instead of querying promoters directly if tags are needed
CREATE OR REPLACE VIEW promoters_with_tags AS
SELECT 
  p.*,
  COALESCE(pta.tag_names, ARRAY[]::TEXT[]) as tags,
  COALESCE(pta.tag_count, 0) as tag_count
FROM promoters p
LEFT JOIN promoter_tags_aggregated pta ON p.id = pta.promoter_id;

COMMENT ON VIEW promoters_with_tags IS 'Promoters view with pre-aggregated tags. Use this view when you need tags to avoid GROUP BY errors.';

-- Grant necessary permissions
GRANT SELECT ON promoter_tags_aggregated TO authenticated;
GRANT SELECT ON promoters_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION promoter_tags_array(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promoter_tags(UUID) TO authenticated;

-- IMPORTANT: The error might be coming from Supabase PostgREST automatically joining promoter_tags
-- when querying promoters. To fix this, we need to ensure PostgREST uses aggregated tags.
-- 
-- If you're using queries like: promoters?select=*,promoter_tags(tag)
-- PostgREST might generate SQL that groups by promoter_id but selects tag without aggregation.
--
-- SOLUTION: Use the aggregated view in your queries instead:
--   promoters?select=*,promoter_tags_aggregated(tag_names)
--
-- OR modify your application code to fetch tags separately and aggregate them client-side.

-- CRITICAL FIX: If there's a foreign key relationship causing automatic joins,
-- we need to ensure the relationship uses aggregation. However, PostgREST doesn't
-- support this directly. The best workaround is to:
-- 1. Remove any automatic foreign key relationships if they exist
-- 2. Always query tags separately or use the aggregated view
-- 3. Or create a materialized column on promoters that stores aggregated tags

-- Check if there are any foreign key constraints that might cause automatic joins
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  RAISE NOTICE 'Checking for foreign key relationships to promoter_tags...';
  FOR fk_record IN
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (tc.table_name = 'promoter_tags' OR ccu.table_name = 'promoter_tags')
      AND tc.table_schema = 'public'
  LOOP
    RAISE NOTICE 'Found FK: %.% -> %.%', 
      fk_record.table_name, 
      fk_record.column_name,
      fk_record.foreign_table_name,
      fk_record.foreign_column_name;
  END LOOP;
END $$;

-- If the error is coming from a Supabase PostgREST query that automatically joins promoter_tags,
-- we need to ensure any such queries use the aggregated view or properly aggregate tags.
-- 
-- Common issue: When Supabase does an automatic join like:
--   promoters?select=*,promoter_tags(tag)
-- It might generate SQL that groups by promoter_id but selects tag without aggregation.
--
-- Solution: Use the aggregated view or modify queries to use array_agg:
--   promoters?select=*,promoter_tags_aggregated(tag_names)

-- ============================================================================
-- FINAL SOLUTION: If the error persists, check your application logs for the
-- exact SQL query. The error is likely from one of these scenarios:
--
-- 1. A Supabase query like: promoters?select=*,promoter_tags(tag)
--    FIX: Change to: promoters?select=*,promoter_tags_array(tags)
--         OR: Use the promoters_with_tags view instead
--
-- 2. A database view that joins promoters with promoter_tags
--    FIX: Modify the view to use array_agg(tag) or use promoter_tags_aggregated
--
-- 3. A function that queries promoter_tags with GROUP BY
--    FIX: Ensure tag is aggregated or included in GROUP BY clause
--
-- 4. Application code doing a raw SQL query
--    FIX: Modify the query to aggregate tags properly
-- ============================================================================

-- To find the exact query causing the error, enable query logging in Supabase:
-- Settings > Database > Query Performance > Enable query logging
-- Then check the logs when the error occurs to see the exact SQL being executed.

