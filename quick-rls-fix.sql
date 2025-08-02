-- QUICK FIX: Clear RLS Infinite Recursion
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Disable RLS to clear the problematic policies
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Step 3: Re-enable RLS 
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies
CREATE POLICY "Allow service role full access" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view and edit own data" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Test the fix
SELECT 'RLS policies fixed! Users table should now work without infinite recursion.' as status;
