-- ================================================================
-- DIAGNOSTIC SCRIPT: User, Role & Profile System Analysis
-- Date: 2025-10-26
-- Purpose: Understand current state before applying fixes
-- ================================================================

-- ================================================================
-- SECTION 1: Check which tables exist
-- ================================================================

SELECT '=== EXISTING TABLES ===' as section;

SELECT 
  table_schema,
  table_name,
  (SELECT count(*) FROM information_schema.columns 
   WHERE table_schema = t.table_schema 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%user%' 
  OR table_name LIKE '%profile%' 
  OR table_name LIKE '%role%'
  OR table_name LIKE '%permission%'
)
ORDER BY table_name;

-- ================================================================
-- SECTION 2: Check profiles table structure
-- ================================================================

SELECT '=== PROFILES TABLE STRUCTURE ===' as section;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ================================================================
-- SECTION 3: Check if users table exists (separate from profiles)
-- ================================================================

SELECT '=== USERS TABLE (if exists) ===' as section;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ================================================================
-- SECTION 4: Check foreign key relationships
-- ================================================================

SELECT '=== FOREIGN KEY CONSTRAINTS ===' as section;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND (
  tc.table_name LIKE '%user%'
  OR tc.table_name LIKE '%profile%'
  OR tc.table_name LIKE '%role%'
)
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================
-- SECTION 5: Check role storage locations
-- ================================================================

SELECT '=== ROLE STORAGE CHECK ===' as section;

-- Check profiles.role if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'profiles.role column exists';
    -- Can't do dynamic SELECT here, but user can run separately
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'users.role column exists';
  END IF;
END $$;

-- ================================================================
-- SECTION 6: Check RBAC tables
-- ================================================================

SELECT '=== RBAC SYSTEM TABLES ===' as section;

SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as columns,
  (SELECT pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass))) as size
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name LIKE 'rbac_%'
ORDER BY table_name;

-- ================================================================
-- SECTION 7: Count records in key tables
-- ================================================================

SELECT '=== RECORD COUNTS ===' as section;

DO $$
DECLARE
  rec RECORD;
  sql TEXT;
  cnt BIGINT;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (
      table_name IN ('profiles', 'users', 'user_roles', 'rbac_roles', 
                     'rbac_permissions', 'rbac_user_role_assignments')
    )
  LOOP
    sql := format('SELECT count(*) FROM %I', rec.table_name);
    EXECUTE sql INTO cnt;
    RAISE NOTICE '% has % records', rec.table_name, cnt;
  END LOOP;
END $$;

-- ================================================================
-- SECTION 8: Sample data comparison
-- ================================================================

SELECT '=== SAMPLE AUTH.USERS vs PROFILES ===' as section;

SELECT 
  au.id,
  au.email as auth_email,
  p.email as profile_email,
  au.raw_user_meta_data->>'full_name' as auth_full_name,
  p.full_name as profile_full_name,
  au.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  CASE 
    WHEN au.email != p.email THEN '❌ Email mismatch'
    WHEN au.raw_user_meta_data->>'full_name' != p.full_name THEN '⚠️ Name mismatch'
    WHEN au.raw_user_meta_data->>'role' != p.role THEN '⚠️ Role mismatch'
    ELSE '✅ OK'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LIMIT 10;

-- ================================================================
-- SECTION 9: Check for orphaned records
-- ================================================================

SELECT '=== ORPHANED RECORDS CHECK ===' as section;

-- Profiles without auth.users
SELECT 
  'Profiles without auth.users' as check_type,
  count(*) as count
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = p.id
);

-- auth.users without profiles
SELECT 
  'auth.users without profiles' as check_type,
  count(*) as count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- ================================================================
-- SECTION 10: Check RLS policies
-- ================================================================

SELECT '=== RLS POLICIES ===' as section;

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
WHERE schemaname = 'public'
AND (tablename LIKE '%user%' OR tablename LIKE '%profile%' OR tablename LIKE '%role%')
ORDER BY tablename, policyname;

-- ================================================================
-- SECTION 11: Check functions with SECURITY DEFINER
-- ================================================================

SELECT '=== SECURITY DEFINER FUNCTIONS ===' as section;

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE p.prosecdef 
    WHEN true THEN '⚠️ SECURITY DEFINER' 
    ELSE 'SECURITY INVOKER' 
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%user%' 
   OR p.proname LIKE '%profile%' 
   OR p.proname LIKE '%role%'
   OR p.proname LIKE '%permission%'
ORDER BY p.proname;

-- ================================================================
-- SUMMARY
-- ================================================================

SELECT '=== DIAGNOSTIC COMPLETE ===' as section;

SELECT 
  'Review the results above to understand:' as instruction
UNION ALL
SELECT '1. Which tables exist (profiles vs users)'
UNION ALL
SELECT '2. Current foreign key structure'
UNION ALL
SELECT '3. Data synchronization status'
UNION ALL
SELECT '4. Orphaned records that need cleanup'
UNION ALL
SELECT '5. RLS policy coverage'
UNION ALL
SELECT '6. Functions needing search_path fixes';

