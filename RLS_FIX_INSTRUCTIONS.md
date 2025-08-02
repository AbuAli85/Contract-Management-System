# Fix for RLS Recursion and 401 Authentication Issues

## Issue Summary
- **RLS Infinite Recursion**: The profiles table RLS policies are checking `users.role` which creates circular dependencies
- **401 Unauthorized**: API routes failing due to authentication/session issues
- **Frontend Errors**: useUserRole hook failing to fetch user roles

## Step 1: Fix RLS Policies (CRITICAL - Do this first)

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Fix RLS infinite recursion issue on profiles table
-- Run this SQL in Supabase SQL editor

-- Step 1: Disable RLS temporarily to fix policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Step 3: Re-enable RLS with safe policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, safe policies (no recursion)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 5: Create safe function for getting user role
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
```

## Step 2: After Running the SQL

1. **Refresh your browser/clear cookies** - The authentication state might be cached
2. **Restart your development server** - This ensures fresh connections

## Step 3: If Still Having Issues

The problem might be that your user doesn't have a proper profile record. Let's check and fix:

**Check if you have a profile record:**
```sql
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID_HERE';
```

**If no profile exists, create one:**
```sql
INSERT INTO profiles (id, email, role, status, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE',
  'your-email@example.com', 
  'admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();
```

## Step 4: Test the Fix

1. Open browser dev tools
2. Go to your application
3. Check if the RLS recursion errors are gone
4. Check if the user role is loading properly
5. Try accessing the user approvals page

## What This Fix Does

1. **Removes Recursive Policies**: No more policies that check role inside role queries
2. **Simplifies RLS**: Users can only see/edit their own profiles
3. **Admin Access**: Handled through API routes with service role (bypasses RLS)
4. **Safe Function**: Creates a SECURITY DEFINER function for safe role checking

## Expected Results

- ✅ No more "infinite recursion detected" errors
- ✅ User roles load properly
- ✅ API routes work without 401 errors  
- ✅ User approval navigation appears
- ✅ Admin functions work through service role
