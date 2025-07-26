-- Fix RLS Policies for Promoters Table
-- This script addresses the "new row violates row-level security policy" error

-- Enable RLS on promoters table (if not already enabled)
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoters FORCE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to all authenticated users on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow admin full access on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow authenticated users full access on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow insert for authenticated users on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow update for authenticated users on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow delete for authenticated users on promoters" ON public.promoters;

-- Policy 1: Allow authenticated users to read all promoters
CREATE POLICY "Allow read access to all authenticated users on promoters"
ON public.promoters
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Allow authenticated users to insert new promoters
CREATE POLICY "Allow insert for authenticated users on promoters"
ON public.promoters
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to update promoters
CREATE POLICY "Allow update for authenticated users on promoters"
ON public.promoters
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to delete promoters
CREATE POLICY "Allow delete for authenticated users on promoters"
ON public.promoters
FOR DELETE
USING (auth.role() = 'authenticated');

-- Alternative: More restrictive policy for admin-only operations
-- Uncomment the following if you want only admins to manage promoters

/*
-- Drop the above policies and use these instead:
DROP POLICY IF EXISTS "Allow insert for authenticated users on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow update for authenticated users on promoters" ON public.promoters;
DROP POLICY IF EXISTS "Allow delete for authenticated users on promoters" ON public.promoters;

-- Admin-only insert policy
CREATE POLICY "Allow admin insert on promoters"
ON public.promoters
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Admin-only update policy
CREATE POLICY "Allow admin update on promoters"
ON public.promoters
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Admin-only delete policy
CREATE POLICY "Allow admin delete on promoters"
ON public.promoters
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
*/

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'promoters'
ORDER BY policyname;

-- Test the policies (optional - run this to verify)
-- This will show if the policies are working correctly
SELECT 
    'RLS Policies for promoters table:' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'promoters'; 