-- Manual Script: Grant Permissions for Holding Groups
-- Run this script step by step if you encounter deadlock errors
-- Copy and paste each section one at a time

-- ============================================================================
-- STEP 1: Grant permissions to authenticated role
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON holding_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON holding_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trademarks TO authenticated;

-- ============================================================================
-- STEP 2: Grant permissions to anon role
-- ============================================================================
GRANT SELECT ON holding_groups TO anon;
GRANT SELECT ON holding_group_members TO anon;
GRANT SELECT ON trademarks TO anon;

-- ============================================================================
-- STEP 3: Grant permissions to postgres role
-- ============================================================================
GRANT ALL ON holding_groups TO postgres;
GRANT ALL ON holding_group_members TO postgres;
GRANT ALL ON trademarks TO postgres;

-- ============================================================================
-- STEP 4: Grant permissions to service_role
-- ============================================================================
GRANT ALL ON holding_groups TO service_role;
GRANT ALL ON holding_group_members TO service_role;
GRANT ALL ON trademarks TO service_role;

-- ============================================================================
-- STEP 5: Enable RLS (only if not already enabled)
-- ============================================================================
ALTER TABLE holding_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trademarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies for holding_groups
-- ============================================================================
DROP POLICY IF EXISTS holding_groups_authenticated_all ON holding_groups;
DROP POLICY IF EXISTS holding_groups_anon_read ON holding_groups;

CREATE POLICY holding_groups_authenticated_all ON holding_groups
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY holding_groups_anon_read ON holding_groups
FOR SELECT
TO anon
USING (is_active = true);

-- ============================================================================
-- STEP 7: Create RLS policies for holding_group_members
-- ============================================================================
DROP POLICY IF EXISTS holding_group_members_authenticated_all ON holding_group_members;
DROP POLICY IF EXISTS holding_group_members_anon_read ON holding_group_members;

CREATE POLICY holding_group_members_authenticated_all ON holding_group_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

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

-- ============================================================================
-- STEP 8: Create RLS policies for trademarks
-- ============================================================================
DROP POLICY IF EXISTS trademarks_authenticated_all ON trademarks;
DROP POLICY IF EXISTS trademarks_anon_read ON trademarks;

CREATE POLICY trademarks_authenticated_all ON trademarks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY trademarks_anon_read ON trademarks
FOR SELECT
TO anon
USING (is_active = true);

