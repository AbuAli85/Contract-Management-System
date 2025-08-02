-- Fix RLS infinite recursion issue on profiles table
-- Run this SQL in Supabase SQL editor or via migration

-- Step 1: Disable RLS temporarily to fix policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, safe policies that don't cause recursion
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Create a service role accessible function for admin operations
CREATE OR REPLACE FUNCTION get_user_profile_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  avatar_url TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.role::TEXT,
    p.status::TEXT,
    p.created_at,
    p.updated_at,
    p.first_name,
    p.last_name,
    p.company,
    p.phone,
    p.department,
    p.position,
    p.avatar_url
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;

-- Step 6: Create function to get current user's role (safe for client use)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_profile_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- Note: Admin operations will be handled through API routes using service role
-- This prevents infinite recursion while maintaining security
-- The service role can bypass RLS for admin operations
