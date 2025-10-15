-- ============================================================================
-- RE-ENABLE RLS ON PROMOTERS TABLE WITH PROPER POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor after confirming data is showing correctly
-- ============================================================================

-- First, drop any existing policies
DROP POLICY IF EXISTS "Service role bypass" ON promoters;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON promoters;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON promoters;

-- Enable RLS on promoters table
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can do everything (bypass RLS)
CREATE POLICY "Service role bypass" ON promoters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can read all promoters
CREATE POLICY "Enable read access for authenticated users" ON promoters
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Authenticated users can insert promoters
CREATE POLICY "Enable insert for authenticated users" ON promoters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 4: Authenticated users can update promoters
CREATE POLICY "Enable update for authenticated users" ON promoters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 5: Only admins can delete promoters (via service_role)
CREATE POLICY "Enable delete for service role only" ON promoters
  FOR DELETE
  TO service_role
  USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'promoters'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'promoters';

-- Test query (should still return 112)
SELECT COUNT(*) FROM promoters;

-- ============================================================================
-- NOTES:
-- - Service role (used by API) can do everything
-- - Authenticated users can read/insert/update
-- - Only service role can delete (admin operations)
-- - These policies are permissive - adjust based on your security needs
-- ============================================================================

