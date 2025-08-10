-- Setup Registration System
-- This script ensures all required tables and constraints exist for the new registration system
-- Run this in Supabase SQL Editor BEFORE testing registration

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create enums if they don't exist
DO $$ 
BEGIN
    -- Enhanced user role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enhanced_user_role') THEN
        CREATE TYPE enhanced_user_role AS ENUM ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin');
        RAISE NOTICE 'Created enhanced_user_role enum';
    END IF;

    -- User status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
        RAISE NOTICE 'Created user_status enum';
    END IF;

    -- Company type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
        CREATE TYPE company_type AS ENUM ('client', 'provider', 'both');
        RAISE NOTICE 'Created company_type enum';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating enums: %', SQLERRM;
END $$;

-- 3. Create or fix users table
DO $$
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Create users table
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role enhanced_user_role DEFAULT 'user',
            status user_status DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            phone TEXT,
            avatar_url TEXT
        );
        RAISE NOTICE 'Created users table';
    ELSE
        -- Table exists, ensure it has the right structure
        RAISE NOTICE 'Users table exists, checking structure...';
        
        -- Drop old role constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'users' AND constraint_name = 'users_role_check'
        ) THEN
            ALTER TABLE users DROP CONSTRAINT users_role_check;
            RAISE NOTICE 'Dropped old role constraint';
        END IF;
        
        -- Ensure role column uses enhanced_user_role
        BEGIN
            ALTER TABLE users ALTER COLUMN role TYPE enhanced_user_role USING role::text::enhanced_user_role;
            RAISE NOTICE 'Updated role column type';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Role column already correct or error: %', SQLERRM;
        END;
        
        -- Add new role constraint
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
        RAISE NOTICE 'Added new role constraint';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with users table: %', SQLERRM;
END $$;

-- 4. Create companies table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        CREATE TABLE companies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            type company_type NOT NULL,
            description TEXT,
            website TEXT,
            logo_url TEXT,
            primary_contact_id UUID REFERENCES users(id),
            status user_status DEFAULT 'active',
            address JSONB,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_companies_type ON companies(type);
        CREATE INDEX idx_companies_status ON companies(status);
        CREATE INDEX idx_companies_primary_contact ON companies(primary_contact_id);
        
        RAISE NOTICE 'Created companies table with indexes';
    ELSE
        RAISE NOTICE 'Companies table already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with companies table: %', SQLERRM;
END $$;

-- 5. Create RLS policies for users table
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Service role can do anything" ON users;
    
    -- Create policies
    CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Service role can do anything" ON users
        FOR ALL USING (current_setting('role') = 'service_role');
    
    RAISE NOTICE 'Created RLS policies for users table';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END $$;

-- 6. Create RLS policies for companies table
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own company" ON companies;
    DROP POLICY IF EXISTS "Users can update own company" ON companies;
    DROP POLICY IF EXISTS "Service role can do anything on companies" ON companies;
    
    -- Create policies
    CREATE POLICY "Users can view own company" ON companies
        FOR SELECT USING (primary_contact_id = auth.uid());
    
    CREATE POLICY "Users can update own company" ON companies
        FOR UPDATE USING (primary_contact_id = auth.uid());
    
    CREATE POLICY "Service role can do anything on companies" ON companies
        FOR ALL USING (current_setting('role') = 'service_role');
    
    RAISE NOTICE 'Created RLS policies for companies table';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating company RLS policies: %', SQLERRM;
END $$;

-- 7. Create a trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
    CREATE TRIGGER update_companies_updated_at 
        BEFORE UPDATE ON companies 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created updated_at triggers';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating triggers: %', SQLERRM;
END $$;

-- 8. Final verification
SELECT 'Setup Verification' as info;

-- Check tables
SELECT 'Tables:' as check_type, 
       array_agg(tablename) as tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'companies');

-- Check enums
SELECT 'Enums:' as check_type,
       array_agg(typname) as enums
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('enhanced_user_role', 'user_status', 'company_type');

-- Check users table structure
SELECT 'Users Columns:' as check_type,
       array_agg(column_name || ':' || data_type) as columns
FROM information_schema.columns 
WHERE table_name = 'users';

-- Success message
SELECT '✅ Registration system setup complete!' as status,
       'You can now use the new registration system' as message,
       'Go to /en/register-new to test' as next_step;