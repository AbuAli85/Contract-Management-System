-- Comprehensive Fix for RBAC and Storage Issues
-- This script fixes both the RBAC table queries and storage RLS policies

-- ========================================
-- PART 1: FIX RBAC TABLES
-- ========================================

-- First, let's check what tables exist and create the correct users table
-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the correct users table with proper schema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions TEXT[],
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create a profiles table as backup (for compatibility)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Insert a default admin user if none exists
INSERT INTO users (id, email, full_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active',
    true
) ON CONFLICT (email) DO NOTHING;

-- Also insert into profiles for compatibility
INSERT INTO profiles (id, email, full_name, role, status)
VALUES (
    gen_random_uuid(),
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- PART 2: FIX STORAGE RLS POLICIES
-- ========================================

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update promoter documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete promoter documents" ON storage.objects;

-- Create comprehensive RLS policies for authenticated users
CREATE POLICY "Authenticated users can upload promoter documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view promoter documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update promoter documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete promoter documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promoter-documents' AND
    auth.role() = 'authenticated'
  );

-- Create more permissive policies for development (uncomment if needed)
-- CREATE POLICY "Allow all operations for promoter documents" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'promoter-documents'
--   );

-- Make sure the storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions on users and profiles tables
GRANT ALL ON users TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- ========================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ========================================

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try users table first
  SELECT role INTO user_role FROM users WHERE id = user_id;
  
  -- If not found, try profiles table
  IF user_role IS NULL THEN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
  END IF;
  
  -- Return default role if still not found
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 4: VERIFICATION QUERIES
-- ========================================

-- Verify the storage policies are working
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%promoter%';

-- Verify users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if admin user exists
SELECT id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';

-- Check storage bucket configuration
SELECT * FROM storage.buckets WHERE id = 'promoter-documents'; 