-- Diagnostic Script for Supabase Auth Issues
-- Run this to identify what's causing "Database error querying schema"

-- Check 1: Verify auth schema exists and is accessible
SELECT 
    'Check 1: Auth Schema Access' as check_name,
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check 2: List all tables in auth schema
SELECT 
    'Check 2: Auth Tables' as check_name,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check 3: Check auth.users table structure
SELECT 
    'Check 3: Auth Users Table Structure' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check 4: Check if auth.users has data
SELECT 
    'Check 4: Auth Users Data Count' as check_name,
    COUNT(*) as user_count
FROM auth.users;

-- Check 5: Check public schema tables
SELECT 
    'Check 5: Public Schema Tables' as check_name,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check 6: Check profiles table structure
SELECT 
    'Check 6: Profiles Table Structure' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 7: Check profiles data
SELECT 
    'Check 7: Profiles Data Count' as check_name,
    COUNT(*) as profile_count
FROM public.profiles;

-- Check 8: Check RLS policies on profiles
SELECT 
    'Check 8: RLS Policies on Profiles' as check_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check 9: Check table permissions
SELECT 
    'Check 9: Table Permissions' as check_name,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'profiles');

-- Check 10: Check if auth functions exist
SELECT 
    'Check 10: Auth Functions' as check_name,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;

-- Check 11: Test auth.uid() function
SELECT 
    'Check 11: Auth UID Function Test' as check_name,
    CASE 
        WHEN auth.uid() IS NULL THEN 'auth.uid() returns NULL (expected when not authenticated)'
        ELSE 'auth.uid() returns: ' || auth.uid()::text
    END as result;

-- Check 12: Test auth.role() function
SELECT 
    'Check 12: Auth Role Function Test' as check_name,
    CASE 
        WHEN auth.role() IS NULL THEN 'auth.role() returns NULL (expected when not authenticated)'
        ELSE 'auth.role() returns: ' || auth.role()
    END as result;

-- Check 13: Check database roles and permissions
SELECT 
    'Check 13: Database Roles' as check_name,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('postgres', 'anon', 'authenticated', 'service_role', 'supabase_auth_admin');

-- Check 14: Check if triggers exist
SELECT 
    'Check 14: Triggers on Auth Users' as check_name,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Check 15: Check for any error logs or issues
SELECT 
    'Check 15: Recent Database Activity' as check_name,
    'No specific error logs available in this context' as note;
