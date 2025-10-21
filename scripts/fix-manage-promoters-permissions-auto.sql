-- ============================================================================
-- SMART FIX: Auto-detect RBAC Tables and Grant Promoter Permissions
-- ============================================================================
-- This script automatically detects which RBAC table structure you're using
-- and grants the required 'promoter:read:own' permission to all users
--
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, let's check which tables exist
DO $$
DECLARE
  has_new_rbac BOOLEAN;
  has_legacy_rbac BOOLEAN;
BEGIN
  -- Check for NEW RBAC tables (rbac_* prefix)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rbac_roles'
  ) INTO has_new_rbac;

  -- Check for LEGACY RBAC tables (no prefix)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
  ) INTO has_legacy_rbac;

  -- Display which system is detected
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RBAC System Detection';
  RAISE NOTICE '========================================';
  
  IF has_new_rbac THEN
    RAISE NOTICE '✅ NEW RBAC tables (rbac_*) detected';
  ELSE
    RAISE NOTICE '❌ NEW RBAC tables (rbac_*) NOT found';
  END IF;
  
  IF has_legacy_rbac THEN
    RAISE NOTICE '✅ LEGACY RBAC tables detected';
  ELSE
    RAISE NOTICE '❌ LEGACY RBAC tables NOT found';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF NOT has_new_rbac AND NOT has_legacy_rbac THEN
    RAISE EXCEPTION 'No RBAC tables found! Please run RBAC migrations first.';
  END IF;
END $$;

-- ============================================================================
-- OPTION 1: LEGACY TABLES (Most Common)
-- ============================================================================

-- Step 1: Create 'user' role in legacy tables
INSERT INTO roles (name, category, description, created_at, updated_at)
VALUES (
  'user',
  'client',
  'Default user role with basic permissions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create required permissions in legacy tables
INSERT INTO permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Link permissions to role in legacy tables
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND p.resource = 'promoter'
  AND p.action IN ('read', 'manage')
  AND p.scope = 'own'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 4: Assign 'user' role to ALL users from profiles table (legacy tables)
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, context, valid_from, is_active, created_at, updated_at)
SELECT 
  p.id as user_id,
  r.id as role_id,
  NULL as assigned_by,
  '{}'::jsonb as context,
  NOW() as valid_from,
  TRUE as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
CROSS JOIN roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION (Works for both NEW and LEGACY)
-- ============================================================================

-- Display success message
SELECT 
  '🎉 PERMISSIONS GRANTED!' as status,
  'Using LEGACY RBAC tables' as system;

-- Check if permissions were granted successfully (LEGACY)
SELECT 
  '✅ Summary' as info,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT perm.id) as total_permissions_granted
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN role_permissions rp ON ura.role_id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter';

-- List users with promoter permissions (LEGACY)
SELECT 
  '👥 Users with Promoter Access' as info,
  p.email,
  r.name as role_name,
  perm.name as permission
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
JOIN roles r ON ura.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter'
ORDER BY p.email, perm.name
LIMIT 20;

-- Check for users WITHOUT promoter permissions (LEGACY)
SELECT 
  '⚠️ Users Still Missing Permission' as warning,
  p.id,
  p.email
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions perm ON rp.permission_id = perm.id
  WHERE ura.user_id = p.id
    AND ura.is_active = TRUE
    AND perm.resource = 'promoter'
    AND perm.action = 'read'
    AND perm.scope = 'own'
)
LIMIT 10;

-- ============================================================================
-- FINAL MESSAGE
-- ============================================================================
SELECT 
  '✅ COMPLETE!' as message,
  'All users should now have access to the Manage Promoters page' as details,
  'Please reload the page in your browser and try again' as action;

