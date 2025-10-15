-- ========================================
-- 🔧 PRODUCTION DATABASE FIX
-- ========================================
-- This script fixes schema conflicts and ensures correct RBAC tables exist
-- Run this in Supabase SQL Editor before seeding data

-- ========================================
-- STEP 1: Check what exists
-- ========================================

-- First, let's see what tables we have
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%role%' OR table_name LIKE '%permission%'
ORDER BY table_name;

-- Check permissions table structure if it exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'permissions'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: Drop conflicting tables (if they exist)
-- ========================================

-- Drop old/conflicting RBAC tables
DROP TABLE IF EXISTS rbac_audit_logs CASCADE;
DROP TABLE IF EXISTS rbac_user_role_assignments CASCADE;
DROP TABLE IF EXISTS rbac_role_permissions CASCADE;
DROP TABLE IF EXISTS rbac_permissions CASCADE;
DROP TABLE IF EXISTS rbac_roles CASCADE;
DROP MATERIALIZED VIEW IF EXISTS rbac_user_permissions_mv CASCADE;

-- Drop any existing user_permissions table (not needed)
DROP TABLE IF EXISTS user_permissions CASCADE;

-- Drop and recreate if permissions table has wrong structure
DO $$
BEGIN
    -- Check if permissions table exists but is missing 'resource' column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'permissions'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'permissions' 
        AND column_name = 'resource'
    ) THEN
        -- Table exists but has wrong structure, drop it
        DROP TABLE IF EXISTS role_permissions CASCADE;
        DROP TABLE IF EXISTS user_role_assignments CASCADE;
        DROP TABLE IF EXISTS permissions CASCADE;
        DROP TABLE IF EXISTS roles CASCADE;
        RAISE NOTICE 'Dropped existing RBAC tables with incompatible schema';
    END IF;
END $$;

-- ========================================
-- STEP 3: Create correct RBAC schema
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('client', 'provider', 'admin', 'system')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions table with correct structure
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('own', 'provider', 'organization', 'booking', 'public', 'all')),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(role_id, permission_id)
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID NULL,
    context JSONB DEFAULT '{}',
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- STEP 4: Create indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_category ON roles(category);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active);

-- ========================================
-- STEP 5: Enable RLS
-- ========================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS service_role_all_roles ON roles;
CREATE POLICY service_role_all_roles ON roles FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_permissions ON permissions;
CREATE POLICY service_role_all_permissions ON permissions FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_role_permissions ON role_permissions;
CREATE POLICY service_role_all_role_permissions ON role_permissions FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_user_role_assignments ON user_role_assignments;
CREATE POLICY service_role_all_user_role_assignments ON user_role_assignments FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- VERIFICATION
-- ========================================

-- Check final structure
SELECT 
    'roles' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'roles'
UNION ALL
SELECT 
    'permissions' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'permissions'
UNION ALL
SELECT 
    'role_permissions' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'role_permissions'
UNION ALL
SELECT 
    'user_role_assignments' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_role_assignments';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RBAC schema is ready! Now run seed_rbac.sql';
END $$;

