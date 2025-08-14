-- Fix Supabase Auth Schema - Run this in your Supabase SQL Editor
-- This will fix the "Database error querying schema" issue

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop existing tables that might conflict
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 3: Create the profiles table that Supabase expects
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

-- Step 4: Create indexes
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_status_idx ON public.profiles(status);

-- Step 5: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 7: Create function for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Step 8: Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Step 10: Create test admin user (only if it doesn't exist)
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@test.com';
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    -- Only create if doesn't exist
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            admin_email,
            crypt('AdminPass123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"first_name": "Admin", "last_name": "User", "role": "admin"}'
        );
        
        -- Get the newly created user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
        
        -- Create profile for the admin user
        INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
        VALUES (
            admin_user_id,
            admin_email,
            'Admin',
            'User',
            'admin',
            'approved'
        );
        
        RAISE NOTICE 'Admin user created successfully with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
        
        -- Ensure profile exists for existing admin user
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
            RAISE NOTICE 'Profile created for existing admin user';
        END IF;
    END IF;
END $$;

-- Step 11: Verify the setup
SELECT 'Schema setup complete!' as status;
SELECT COUNT(*) as profiles_count FROM public.profiles;
SELECT COUNT(*) as users_count FROM auth.users;

-- Step 12: Show created admin user details
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
