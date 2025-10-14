-- ========================================
-- 🔍 Check Database Schema
-- ========================================
-- This script checks what RBAC tables exist in your database
-- Run this FIRST to diagnose the schema issue
-- ========================================

-- Check for RBAC tables (standard names)
SELECT 
    'Standard RBAC Tables' as category,
    table_name,
    'EXISTS ✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_role_assignments', 'audit_logs', 'user_permissions')
ORDER BY table_name;

-- Check for RBAC tables (prefixed names)
SELECT 
    'Prefixed RBAC Tables' as category,
    table_name,
    'EXISTS ✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'rbac_%'
ORDER BY table_name;

-- Check all tables in public schema
SELECT 
    'All Public Tables' as category,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- If roles table exists, check its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        RAISE NOTICE 'roles table structure:';
    END IF;
END $$;

SELECT 
    'roles columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'roles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If rbac_roles table exists, check its structure
SELECT 
    'rbac_roles columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'rbac_roles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If permissions table exists, check its structure
SELECT 
    'permissions columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'permissions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If rbac_permissions table exists, check its structure
SELECT 
    'rbac_permissions columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'rbac_permissions'
AND table_schema = 'public'
ORDER BY ordinal_position;

