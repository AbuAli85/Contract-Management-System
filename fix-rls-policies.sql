-- Fix RLS Policies for profiles table
-- This script should be run in Supabase SQL Editor

-- First, drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles; 
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Allow all authenticated users to read any profile
CREATE POLICY "profiles_select_for_authenticated" ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile  
CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert only their own profile
CREATE POLICY "profiles_insert_own" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Optional: Allow service role to do everything
CREATE POLICY "profiles_service_role_all" ON profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
