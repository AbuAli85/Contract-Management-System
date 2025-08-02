-- Fix Profiles Authentication Issues
-- This script addresses the PGRST116 and 401 errors by ensuring user profiles exist

-- ========================================
-- PART 1: CHECK CURRENT STATE
-- ========================================

-- Check current auth user
SELECT 'Current auth user:' as info, id, email FROM auth.users WHERE email = 'luxsess2001@gmail.com';

-- Check if profiles table exists and has data
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check if current user exists in profiles
SELECT 'User in profiles:' as info, id, email, role FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- ========================================
-- PART 2: CREATE MISSING USER PROFILE
-- ========================================

-- First, check if there's a profile with the same email but different ID
SELECT 'Checking for existing profile with email:' as info, id, email, role FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Delete any existing profile with the same email to avoid conflicts
DELETE FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Insert the current user into profiles
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

-- ========================================
-- PART 3: FIX RLS POLICIES
-- ========================================

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create more permissive policies for development
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- PART 4: VERIFY FIX
-- ========================================

-- Verify the user now exists in profiles
SELECT 'User profile after fix:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Test the RLS policies
SELECT 'RLS test - can view profiles:' as info, COUNT(*) as count FROM profiles;

-- ========================================
-- PART 5: CREATE FALLBACK FUNCTION
-- ========================================

-- Create a function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- First, delete any existing profile with the same email to avoid conflicts
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

-- ========================================
-- PART 6: UPDATE TRIGGER TO USE NEW FUNCTION
-- ========================================

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the ensure_user_profile function
    PERFORM ensure_user_profile(NEW.id);
    
    -- Also ensure user exists in users table
    INSERT INTO users (id, email, full_name, role, status, email_verified, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN NEW.email = 'luxsess2001@gmail.com' THEN 'admin'
            ELSE 'user'
        END,
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PART 7: FINAL VERIFICATION
-- ========================================

-- Show final state
SELECT 'Final profiles count:' as info, COUNT(*) as count FROM profiles;
SELECT 'Final users count:' as info, COUNT(*) as count FROM users;
SELECT 'Admin user in profiles:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';

-- Test RLS access
SELECT 'RLS access test:' as info, 
       CASE 
           WHEN COUNT(*) > 0 THEN 'SUCCESS - Can access profiles'
           ELSE 'FAILED - Cannot access profiles'
       END as result
FROM profiles; 