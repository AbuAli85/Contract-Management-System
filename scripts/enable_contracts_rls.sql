-- ============================================================================
-- RE-ENABLE RLS ON CONTRACTS TABLE WITH PROPER POLICIES
-- ============================================================================
-- Run this AFTER confirming contract creation works with RLS disabled
-- ============================================================================

-- First, drop any existing policies
DROP POLICY IF EXISTS "Service role bypass" ON contracts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Enable delete for service role only" ON contracts;

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can do everything (bypass RLS)
CREATE POLICY "Service role bypass" ON contracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can read all contracts
CREATE POLICY "Enable read access for authenticated users" ON contracts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Authenticated users can insert contracts
CREATE POLICY "Enable insert for authenticated users" ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 4: Authenticated users can update contracts
CREATE POLICY "Enable update for authenticated users" ON contracts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 5: Only admins can delete contracts (via service_role)
CREATE POLICY "Enable delete for service role only" ON contracts
  FOR DELETE
  TO service_role
  USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'contracts'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contracts';

-- ============================================================================
-- NOTES:
-- - Service role (used by API) can do everything
-- - Authenticated users can read/insert/update
-- - Only service role can delete (admin operations)
-- - Adjust policies based on your specific security needs
-- ============================================================================

