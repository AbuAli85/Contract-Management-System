-- Migration: Add RLS Policies and Permissions for Holding Groups
-- Date: 2025-02-01
-- Description: Enable RLS and grant permissions for holding_groups, holding_group_members, and trademarks tables
-- 
-- IMPORTANT: If you get a deadlock error, wait a few seconds and try again.
-- This migration uses smaller transactions to avoid deadlocks.

-- ============================================================================
-- 1. GRANT PERMISSIONS (Run in separate transaction to avoid deadlocks)
-- ============================================================================

BEGIN;

-- Grant permissions to authenticated role (for RLS policies to work)
GRANT SELECT, INSERT, UPDATE, DELETE ON holding_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON holding_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trademarks TO authenticated;

COMMIT;

BEGIN;

-- Grant permissions to anon role (for public read access if needed)
GRANT SELECT ON holding_groups TO anon;
GRANT SELECT ON holding_group_members TO anon;
GRANT SELECT ON trademarks TO anon;

COMMIT;

BEGIN;

-- Grant permissions to postgres role (database owner)
GRANT ALL ON holding_groups TO postgres;
GRANT ALL ON holding_group_members TO postgres;
GRANT ALL ON trademarks TO postgres;

COMMIT;

BEGIN;

-- Grant permissions to service_role (for service role key to bypass RLS)
GRANT ALL ON holding_groups TO service_role;
GRANT ALL ON holding_group_members TO service_role;
GRANT ALL ON trademarks TO service_role;

COMMIT;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY (Run in separate transaction)
-- ============================================================================

BEGIN;

-- Enable RLS only if not already enabled (to avoid errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'holding_groups'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE holding_groups ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'holding_group_members'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE holding_group_members ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'trademarks'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE trademarks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- 3. RLS POLICIES FOR HOLDING_GROUPS (Run in separate transaction)
-- ============================================================================

BEGIN;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS holding_groups_authenticated_all ON holding_groups;
DROP POLICY IF EXISTS holding_groups_anon_read ON holding_groups;

-- Policy 1: Authenticated users can do everything (manage all holding groups)
CREATE POLICY holding_groups_authenticated_all ON holding_groups
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 2: Anonymous users can read active holding groups
CREATE POLICY holding_groups_anon_read ON holding_groups
FOR SELECT
TO anon
USING (is_active = true);

COMMIT;

-- ============================================================================
-- 4. RLS POLICIES FOR HOLDING_GROUP_MEMBERS (Run in separate transaction)
-- ============================================================================

BEGIN;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS holding_group_members_authenticated_all ON holding_group_members;
DROP POLICY IF EXISTS holding_group_members_anon_read ON holding_group_members;

-- Policy 1: Authenticated users can do everything (manage all members)
CREATE POLICY holding_group_members_authenticated_all ON holding_group_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 2: Anonymous users can read members of active holding groups
CREATE POLICY holding_group_members_anon_read ON holding_group_members
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM holding_groups hg
    WHERE hg.id = holding_group_members.holding_group_id
    AND hg.is_active = true
  )
);

COMMIT;

-- ============================================================================
-- 5. RLS POLICIES FOR TRADEMARKS (Run in separate transaction)
-- ============================================================================

BEGIN;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS trademarks_authenticated_all ON trademarks;
DROP POLICY IF EXISTS trademarks_anon_read ON trademarks;

-- Policy 1: Authenticated users can do everything (manage all trademarks)
CREATE POLICY trademarks_authenticated_all ON trademarks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 2: Anonymous users can read active trademarks
CREATE POLICY trademarks_anon_read ON trademarks
FOR SELECT
TO anon
USING (is_active = true);

COMMIT;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON POLICY holding_groups_authenticated_all ON holding_groups IS 
  'Allows authenticated users to create, read, update, and delete all holding groups';

COMMENT ON POLICY holding_group_members_authenticated_all ON holding_group_members IS 
  'Allows authenticated users to create, read, update, and delete all holding group members';

COMMENT ON POLICY trademarks_authenticated_all ON trademarks IS 
  'Allows authenticated users to create, read, update, and delete all trademarks';

