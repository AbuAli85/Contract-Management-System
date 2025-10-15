-- ============================================================================
-- FIX PROMOTERS "NO DATA" ISSUE
-- ============================================================================
-- This script diagnoses and fixes the most common causes of promoters not
-- showing on the page even when data exists in the database.
-- ============================================================================

-- STEP 1: DIAGNOSTIC - Check what we have
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 1: DIAGNOSTIC CHECKS';
    RAISE NOTICE '========================================';
END $$;

-- Check table counts
SELECT 
    'promoters' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 0 THEN '⚠️ NO DATA' ELSE '✅ HAS DATA' END as status
FROM promoters
UNION ALL
SELECT 
    'users',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '⚠️ NO DATA' ELSE '✅ HAS DATA' END
FROM users
UNION ALL
SELECT 
    'profiles',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '⚠️ NO DATA' ELSE '✅ HAS DATA' END
FROM profiles;

-- Check current user's role in both tables
SELECT 
    '🔍 Current user in USERS table' as check_type,
    id,
    email,
    role,
    CASE 
        WHEN role IN ('admin', 'manager', 'user') THEN '✅ Valid role'
        ELSE '⚠️ Invalid role for RLS'
    END as role_status
FROM users 
WHERE id = auth.uid();

SELECT 
    '🔍 Current user in PROFILES table' as check_type,
    id,
    email,
    role,
    CASE 
        WHEN role IN ('admin', 'manager', 'user') THEN '✅ Valid role'
        WHEN role IS NULL THEN '❌ No role (RLS will BLOCK)'
        ELSE '⚠️ Invalid role for RLS'
    END as role_status
FROM profiles
WHERE id = auth.uid();

-- Check RLS policies
SELECT 
    '🔒 RLS Policy: ' || policyname as policy,
    CASE 
        WHEN qual LIKE '%profiles%' THEN '📋 Checks PROFILES table'
        WHEN qual LIKE '%users%' THEN '👥 Checks USERS table'
        ELSE '❓ Unknown'
    END as checks_table,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'promoters'
ORDER BY policyname;

-- Test if user can see promoters
SELECT 
    '🎯 Visible promoters with current RLS' as test,
    COUNT(*) as visible_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ USER CANNOT SEE ANY PROMOTERS (RLS BLOCKING)'
        ELSE '✅ User can see promoters'
    END as result
FROM promoters;

-- Check which table RLS is using
SELECT 
    '🔍 RLS Check for PROFILES table' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        ) THEN '✅ User HAS valid role in profiles table'
        ELSE '❌ User DOES NOT have valid role in profiles table (THIS IS BLOCKING ACCESS)'
    END as result;

SELECT 
    '🔍 RLS Check for USERS table' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        ) THEN '✅ User HAS valid role in users table'
        ELSE '❌ User DOES NOT have valid role in users table'
    END as result;


-- STEP 2: FIX - Sync roles from users to profiles
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 2: SYNCING ROLES FROM USERS TO PROFILES';
    RAISE NOTICE '========================================';
END $$;

-- Sync current user's role from users to profiles
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.full_name, u.email) as full_name,
    COALESCE(u.role, 'user') as role,
    u.created_at,
    NOW() as updated_at
FROM users u
WHERE u.id = auth.uid()
ON CONFLICT (id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Verify the sync
SELECT 
    '✅ AFTER SYNC - User in profiles table' as status,
    id,
    email,
    role,
    updated_at
FROM profiles
WHERE id = auth.uid();


-- STEP 3: UPDATE RLS POLICIES TO USE USERS TABLE (Alternative Fix)
-- ============================================================================
-- Uncomment this section if you prefer to update RLS policies instead of syncing data

/*
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: UPDATING RLS POLICIES TO USE USERS TABLE';
    RAISE NOTICE '========================================';
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all promoters" ON promoters;
DROP POLICY IF EXISTS "Users can create promoters" ON promoters;
DROP POLICY IF EXISTS "Users can update promoters" ON promoters;
DROP POLICY IF EXISTS "Users can delete promoters" ON promoters;

-- Create new policies that check users table instead
CREATE POLICY "Users can view all promoters" ON promoters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

CREATE POLICY "Users can create promoters" ON promoters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can update promoters" ON promoters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can delete promoters" ON promoters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated to check USERS table';
END $$;
*/


-- STEP 4: VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 4: FINAL VERIFICATION';
    RAISE NOTICE '========================================';
END $$;

-- Test if fix worked
SELECT 
    '🎯 FINAL TEST: Visible promoters' as test,
    COUNT(*) as visible_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ STILL BLOCKED - Try alternative fix or check data'
        ELSE '✅ SUCCESS - User can now see promoters!'
    END as result
FROM promoters;

-- Show what user can now see
SELECT 
    '📋 Sample of visible promoters' as info,
    id,
    name_en,
    name_ar,
    status,
    created_at
FROM promoters
ORDER BY created_at DESC
LIMIT 5;


-- STEP 5: INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Review the diagnostic results above';
    RAISE NOTICE '2. If visible_count is still 0:';
    RAISE NOTICE '   - Check if promoters table has data';
    RAISE NOTICE '   - Uncomment STEP 3 to update RLS policies';
    RAISE NOTICE '   - Or add test data if table is empty';
    RAISE NOTICE '3. Refresh the promoters page in browser';
    RAISE NOTICE '4. Check browser console for any errors';
    RAISE NOTICE '5. Use the debug component on the page';
    RAISE NOTICE '';
    RAISE NOTICE '💡 TIP: If RBAC is blocking, set RBAC_ENFORCEMENT=dry-run';
    RAISE NOTICE '';
END $$;

