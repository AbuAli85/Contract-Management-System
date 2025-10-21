-- ============================================================================
-- Check Which RBAC Tables Exist in Your Database
-- ============================================================================
-- Run this first to see which table structure you have
-- ============================================================================

-- Check for NEW RBAC tables (rbac_* prefix)
SELECT 
  '🔍 NEW RBAC Tables' as category,
  table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status
FROM (VALUES 
  ('rbac_roles'),
  ('rbac_permissions'),
  ('rbac_role_permissions'),
  ('rbac_user_role_assignments')
) AS t(table_name);

-- Check for LEGACY RBAC tables (no prefix)
SELECT 
  '🔍 LEGACY RBAC Tables' as category,
  table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status
FROM (VALUES 
  ('roles'),
  ('permissions'),
  ('role_permissions'),
  ('user_role_assignments')
) AS t(table_name);

-- Check profiles table
SELECT 
  '🔍 Core Tables' as category,
  'profiles' as table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status;

-- Display recommendation
SELECT 
  '💡 RECOMMENDATION' as info,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rbac_roles')
    THEN 'Use: scripts/fix-manage-promoters-permissions.sql (NEW RBAC)'
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles')
    THEN 'Use: scripts/fix-manage-promoters-permissions-auto.sql (LEGACY RBAC) ⬅️ USE THIS ONE'
    ELSE 'ERROR: No RBAC tables found! Run RBAC migrations first.'
  END as which_script_to_use;

