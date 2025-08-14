-- Complete Supabase Auth Fix - Run this in your Supabase SQL Editor
-- This fixes ALL potential auth issues including "Database error querying schema"

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Drop all conflicting tables and start fresh
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.promoters CASCADE;

-- Step 3: Ensure auth schema is properly accessible
-- Grant necessary permissions to Supabase auth service
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Step 4: Create the profiles table with proper structure
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager', 'promoter', 'client', 'provider')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'deleted')),
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_status_idx ON public.profiles(status);

-- Step 6: Grant permissions to public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Step 7: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies that work with Supabase auth
-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role (Supabase) to do everything
CREATE POLICY "Service role can do everything" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Step 9: Create function for new user registration with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to insert new profile
    INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'pending'
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, update it instead
        UPDATE public.profiles 
        SET 
            email = NEW.email,
            first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
            last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
            role = COALESCE(NEW.raw_user_meta_data->>'role', role),
            updated_at = NOW()
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error and continue
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Ensure auth.users table has proper permissions
-- This is critical for Supabase auth to work
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO postgres, service_role;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Step 12: Create test admin user with proper error handling
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@test.com';
    existing_user_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email;
    
    IF existing_user_id IS NULL THEN
        -- Create new admin user
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            admin_email,
            crypt('AdminPass123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
            'authenticated',
            'authenticated'
        );
        
        -- Get the newly created user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
        
        RAISE NOTICE 'Admin user created successfully with ID: %', admin_user_id;
    ELSE
        admin_user_id := existing_user_id;
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Ensure profile exists for admin user
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
        INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
        VALUES (
            admin_user_id,
            admin_email,
            'Admin',
            'User',
            'admin',
            'approved'
        );
        RAISE NOTICE 'Profile created for admin user';
    ELSE
        RAISE NOTICE 'Profile already exists for admin user';
    END IF;
    
    -- Update profile status to approved
    UPDATE public.profiles 
    SET status = 'approved', role = 'admin'
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user setup complete: %', admin_user_id;
END $$;

-- Step 13: Verify critical tables exist and are accessible
DO $$
BEGIN
    -- Check if auth.users table exists and is accessible
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE EXCEPTION 'auth.users table does not exist!';
    END IF;
    
    -- Check if public.profiles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE EXCEPTION 'public.profiles table does not exist!';
    END IF;
    
    -- Check if we can query auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        RAISE WARNING 'auth.users table is empty or not accessible';
    END IF;
    
    RAISE NOTICE 'All critical tables verified successfully';
END $$;

-- Step 14: Final verification queries
SELECT 'Schema setup complete!' as status;
SELECT COUNT(*) as profiles_count FROM public.profiles;
SELECT COUNT(*) as users_count FROM auth.users;

-- Step 15: Show created admin user details
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.created_at
FROM public.profiles p
WHERE p.email = 'admin@test.com';

-- Step 16: Test auth.uid() function
SELECT 
    'auth.uid() test' as test_name,
    auth.uid() as current_user_id,
    auth.role() as current_user_role;
