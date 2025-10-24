-- ============================================================================
-- FIX PROMOTERS RLS POLICIES TO ALLOW CSV IMPORTS
-- ============================================================================
-- This migration updates the promoters RLS policies to allow authenticated
-- users to insert promoters without requiring a profiles table entry.
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create promoters" ON promoters;
DROP POLICY IF EXISTS "Users can update promoters" ON promoters;
DROP POLICY IF EXISTS "Users can view all promoters" ON promoters;
DROP POLICY IF EXISTS "Users can delete promoters" ON promoters;
DROP POLICY IF EXISTS "Promoters can view own data" ON promoters;

-- Drop any other existing policies
DROP POLICY IF EXISTS "Service role bypass" ON promoters;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable delete for service role only" ON promoters;

-- Service role can do everything (bypass RLS)
CREATE POLICY "Service role bypass" ON promoters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- All authenticated users can read promoters
CREATE POLICY "Enable read access for authenticated users" ON promoters
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert promoters (for CSV import)
CREATE POLICY "Enable insert for authenticated users" ON promoters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can update promoters
CREATE POLICY "Enable update for authenticated users" ON promoters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- All authenticated users can delete promoters
CREATE POLICY "Enable delete for authenticated users" ON promoters
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'promoters'
ORDER BY policyname;

-- ============================================================================
-- NOTES:
-- - This makes the promoters table more permissive, similar to parties table
-- - All authenticated users can perform CRUD operations
-- - Service role has full access
-- - If you need more restrictive policies based on roles, you'll need to
--   ensure the profiles table is properly set up with user roles
-- ============================================================================


