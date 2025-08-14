-- ========================================
-- 🔧 DATABASE SCHEMA FIX SCRIPT
-- ========================================
-- This script creates all missing tables and fixes the database schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 🗄️ USERS TABLE
-- ========================================
-- Drop and recreate users table to avoid conflicts
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'provider', 'client')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'approved', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions TEXT[], -- Array of permission strings
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ========================================
-- 🔐 PROFILES TABLE
-- ========================================
-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 📋 PERMISSIONS TABLE
-- ========================================
-- Drop and recreate permissions table
DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (id, name, description, category) VALUES
-- User Management
('users.view', 'View Users', 'Can view user list and details', 'User Management'),
('users.create', 'Create Users', 'Can create new users', 'User Management'),
('users.edit', 'Edit Users', 'Can edit user information', 'User Management'),
('users.delete', 'Delete Users', 'Can delete users', 'User Management'),
('users.bulk', 'Bulk Actions', 'Can perform bulk operations on users', 'User Management'),

-- Contract Management
('contracts.view', 'View Contracts', 'Can view contracts', 'Contract Management'),
('contracts.create', 'Create Contracts', 'Can create new contracts', 'Contract Management'),
('contracts.edit', 'Edit Contracts', 'Can edit contracts', 'Contract Management'),
('contracts.delete', 'Delete Contracts', 'Can delete contracts', 'Contract Management'),
('contracts.approve', 'Approve Contracts', 'Can approve contracts', 'Contract Management'),

-- Dashboard & Analytics
('dashboard.view', 'View Dashboard', 'Can view dashboard', 'Dashboard'),
('analytics.view', 'View Analytics', 'Can view analytics and reports', 'Dashboard'),
('reports.generate', 'Generate Reports', 'Can generate reports', 'Dashboard'),

-- System Administration
('settings.view', 'View Settings', 'Can view system settings', 'System'),
('settings.edit', 'Edit Settings', 'Can edit system settings', 'System'),
('logs.view', 'View Logs', 'Can view system logs', 'System'),
('backup.create', 'Create Backups', 'Can create system backups', 'System');

-- ========================================
-- 📊 USER ACTIVITY LOG TABLE
-- ========================================
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- ========================================
-- 📝 CONTRACTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (type IN ('employment', 'service', 'partnership', 'vendor', 'consulting', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'terminated', 'expired')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Party relationships
    client_id UUID REFERENCES users(id),
    employer_id UUID REFERENCES users(id),
    promoter_id INTEGER,
    
    -- Contract terms
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    renewal_terms TEXT,
    termination_clause TEXT,
    notice_period INTEGER DEFAULT 30,
    
    -- Financial terms
    total_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms TEXT,
    billing_frequency VARCHAR(50),
    
    -- Additional fields
    tags TEXT[],
    attachments JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ========================================
-- 👥 PROMOTERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS promoters (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Address information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Professional information
    job_title VARCHAR(255),
    department VARCHAR(100),
    work_location VARCHAR(255),
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
    
    -- Status and availability
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    availability VARCHAR(50) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable', 'part_time')),
    overall_status VARCHAR(50) DEFAULT 'good' CHECK (overall_status IN ('excellent', 'good', 'fair', 'warning', 'critical')),
    
    -- Documents
    id_card_number VARCHAR(100),
    id_card_expiry_date DATE,
    passport_number VARCHAR(100),
    passport_expiry_date DATE,
    
    -- Additional information
    bio TEXT,
    notes TEXT,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 🔧 TRIGGERS AND FUNCTIONS
-- ========================================
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoters_updated_at 
    BEFORE UPDATE ON promoters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 🔐 RLS POLICIES
-- ========================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these later)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Profiles are viewable by owner" ON profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Profiles are updatable by owner" ON profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- ========================================
-- 📊 SAMPLE DATA
-- ========================================
-- Insert a default admin user (you can change this)
INSERT INTO users (id, email, full_name, role, status, email_verified) VALUES
(
    '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170', -- Use the actual user ID from your auth
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'approved',
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified = EXCLUDED.email_verified;

-- ========================================
-- ✅ VERIFICATION
-- ========================================
-- Check if tables were created successfully
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ Created' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'contracts', 'promoters', 'permissions', 'user_activity_log')
ORDER BY table_name;

-- Check table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
