-- Fix infinite recursion in RLS policies
-- This script addresses the "infinite recursion detected in policy for relation 'profiles'" error

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create safe admin policies that don't reference the same table
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = '611d9a4a-b202-4112-9869-cff47872ac40'::uuid OR  -- Known admin UUID
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'luxsess2001@gmail.com'
        )
    );

CREATE POLICY "Admin can update all profiles" ON profiles
    FOR UPDATE USING (
        auth.uid() = '611d9a4a-b202-4112-9869-cff47872ac40'::uuid OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'luxsess2001@gmail.com'
        )
    );

-- Alternative: Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = '611d9a4a-b202-4112-9869-cff47872ac40'::uuid OR
           EXISTS (
               SELECT 1 FROM auth.users 
               WHERE auth.users.id = auth.uid() 
               AND auth.users.email = 'luxsess2001@gmail.com'
           );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create safe policies using the function
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

CREATE POLICY "Safe admin view all profiles" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Safe admin update all profiles" ON profiles
    FOR UPDATE USING (auth.uid() = id OR is_admin());

COMMENT ON FUNCTION is_admin() IS 'Safe admin check function that avoids RLS recursion';
