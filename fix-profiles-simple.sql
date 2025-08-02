-- Simple Profiles Authentication Fix
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current profiles count:' as info, COUNT(*) as count FROM profiles;

-- Step 2: Check if admin user exists
SELECT 'Admin user check:' as info, id, email, role, status 
FROM profiles 
WHERE email = 'luxsess2001@gmail.com';

-- Step 3: Fix duplicate email issue by deleting existing profile
DELETE FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Step 4: Create admin user profile
INSERT INTO profiles (id, email, full_name, role, status, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User') as full_name,
    'admin' as role,
    'active' as status,
    COALESCE(au.created_at, NOW()) as created_at
FROM auth.users au
WHERE au.email = 'luxsess2001@gmail.com';

-- Step 5: Fix RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Create ensure_user_profile function
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete any existing profile with the same email to avoid conflicts
    DELETE FROM profiles WHERE email = (
        SELECT email FROM auth.users WHERE id = user_id
    );
    
    -- Insert user profile
    INSERT INTO profiles (id, email, full_name, role, status, created_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
        CASE 
            WHEN au.email = 'luxsess2001@gmail.com' THEN 'admin'
            ELSE 'user'
        END as role,
        'active' as status,
        COALESCE(au.created_at, NOW()) as created_at
    FROM auth.users au
    WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_user_profile(UUID) TO authenticated;

-- Step 7: Verify the fix
SELECT 'Final admin user:' as info, id, email, role, status 
FROM profiles 
WHERE email = 'luxsess2001@gmail.com';

SELECT 'RLS test:' as info, 
       CASE 
           WHEN COUNT(*) > 0 THEN 'SUCCESS - Can access profiles'
           ELSE 'FAILED - Cannot access profiles'
       END as result
FROM profiles; 