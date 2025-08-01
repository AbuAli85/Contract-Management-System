-- Temporarily disable RLS for import process
-- Run this before importing data

-- Disable RLS on parties table
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;

-- After import is complete, you can re-enable RLS with:
-- ALTER TABLE parties ENABLE ROW LEVEL SECURITY; 