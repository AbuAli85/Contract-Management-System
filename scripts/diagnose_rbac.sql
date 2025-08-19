-- ========================================
-- 🔍 RBAC DIAGNOSTIC SCRIPT
-- ========================================
-- This script checks the current state of RBAC tables and constraints
-- Run this first to understand what's happening

-- ========================================
-- STEP 1: CHECK TABLE STRUCTURE
-- ========================================

-- Check if rbac_roles table exists and its structure
SELECT 
    'rbac_roles table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_roles') as result;

-- Check the actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rbac_roles'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: CHECK CONSTRAINTS
-- ========================================

-- Check all constraints on rbac_roles table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rbac_roles'::regclass;

-- Check the specific category check constraint
SELECT 
    'Category check constraint' as check_item,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rbac_roles'::regclass 
AND contype = 'c' 
AND conname LIKE '%category%';

-- ========================================
-- STEP 3: CHECK EXISTING DATA
-- ========================================

-- Check existing roles
SELECT 
    'Existing roles' as check_item,
    COUNT(*) as count
FROM rbac_roles;

-- Show existing roles
SELECT 
    id,
    name,
    category,
    description,
    created_at
FROM rbac_roles
ORDER BY created_at;

-- ========================================
-- STEP 4: CHECK PERMISSIONS
-- ========================================

-- Check if rbac_permissions table exists
SELECT 
    'rbac_permissions table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_permissions') as result;

-- Check existing permissions
SELECT 
    'Existing permissions' as check_item,
    COUNT(*) as count
FROM rbac_permissions;

-- Show existing permissions
SELECT 
    id,
    resource,
    action,
    scope,
    name,
    description
FROM rbac_permissions
ORDER BY resource, action, scope;

-- ========================================
-- STEP 5: CHECK FUNCTIONS
-- ========================================

-- Check if the helper functions exist
SELECT 
    'rbac_upsert_role function exists' as check_item,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'rbac_upsert_role') as result;

SELECT 
    'rbac_upsert_permission function exists' as check_item,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'rbac_upsert_permission') as result;

-- ========================================
-- STEP 6: CHECK USER PROFILES
-- ========================================

-- Check if profiles table exists
SELECT 
    'profiles table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as result;

-- Check for the specific user
SELECT 
    'User chairman@falconeyegroup.net exists' as check_item,
    EXISTS(SELECT 1 FROM profiles WHERE email = 'chairman@falconeyegroup.net') as result;

-- Show user profile if exists
SELECT 
    id,
    email,
    role,
    created_at
FROM profiles 
WHERE email = 'chairman@falconeyegroup.net';

-- ========================================
-- COMPLETION
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC Diagnostic Complete!';
    RAISE NOTICE '🔍 Check the results above to understand the current state';
END $$;
