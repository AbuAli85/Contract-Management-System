
-- EMERGENCY FIX: Completely disable RLS to stop infinite recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions to ensure access
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

