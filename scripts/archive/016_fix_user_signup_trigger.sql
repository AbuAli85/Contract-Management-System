-- Fix user signup trigger to create records in both profiles and users tables
-- This ensures new signups appear in the user approval system

-- Update the handle_new_user function to create records in both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        'user', -- Default role
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert into users table with pending status
    INSERT INTO public.users (id, email, full_name, role, status, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user', -- Default role
        'pending', -- All new users start as pending
        NEW.email_confirmed_at IS NOT NULL -- Set email_verified based on email confirmation
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user records in both profiles and users tables when a new user signs up. Users start with pending status for approval.'; 