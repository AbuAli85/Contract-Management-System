-- ============================================================================
-- QUICK FIX: Grant Promoter Permissions to All Users
-- ============================================================================
-- This script fixes the "Permission Denied" error on Manage Promoters page
-- by granting the required 'promoter:read:own' permission to all users
--
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the 'user' role if it doesn't exist (NEW RBAC)
INSERT INTO rbac_roles (name, category, description, created_at)
VALUES (
  'user',
  'client',
  'Default user role with basic permissions',
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create required permissions (NEW RBAC)
INSERT INTO rbac_permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Link permissions to the 'user' role (NEW RBAC)
INSERT INTO rbac_role_permissions (role_id, permission_id, created_at)
SELECT 
  r.id,
  p.id,
  NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'user'
  AND p.resource = 'promoter'
  AND p.action IN ('read', 'manage')
  AND p.scope = 'own'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 4: Assign 'user' role to ALL users from profiles table (NEW RBAC)
INSERT INTO rbac_user_role_assignments (user_id, role_id, assigned_by, context, valid_from, is_active, created_at, updated_at)
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
CROSS JOIN rbac_roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM rbac_user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LEGACY TABLES SUPPORT (If you're using old table structure)
-- ============================================================================

-- Create role in legacy tables
INSERT INTO roles (name, category, description, created_at, updated_at)
VALUES (
  'user',
  'client',
  'Default user role with basic permissions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Create permissions in legacy tables
INSERT INTO permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Link permissions to role in legacy tables
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

-- Assign roles to users in legacy tables
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
-- VERIFICATION
-- ============================================================================

-- Check if permissions were granted successfully
SELECT 
  '✅ Permissions granted' as status,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT perm.id) as total_permissions
FROM profiles p
LEFT JOIN rbac_user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN rbac_role_permissions rp ON ura.role_id = rp.role_id
LEFT JOIN rbac_permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter';

-- List users with promoter permissions
SELECT 
  p.email,
  r.name as role_name,
  perm.name as permission
FROM profiles p
JOIN rbac_user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
JOIN rbac_roles r ON ura.role_id = r.id
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter'
ORDER BY p.email, perm.name;

-- Check for users WITHOUT promoter permissions (these will still get errors)
SELECT 
  p.id,
  p.email,
  '⚠️ Missing promoter:read:own permission' as warning
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM rbac_user_role_assignments ura
  JOIN rbac_role_permissions rp ON ura.role_id = rp.role_id
  JOIN rbac_permissions perm ON rp.permission_id = perm.id
  WHERE ura.user_id = p.id
    AND ura.is_active = TRUE
    AND perm.resource = 'promoter'
    AND perm.action = 'read'
    AND perm.scope = 'own'
)
AND NOT EXISTS (
  SELECT 1 
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions perm ON rp.permission_id = perm.id
  WHERE ura.user_id = p.id
    AND ura.is_active = TRUE
    AND perm.resource = 'promoter'
    AND perm.action = 'read'
    AND perm.scope = 'own'
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 
  '🎉 SUCCESS!' as message,
  'All users should now have access to the Manage Promoters page' as details,
  'Please reload the page in your browser and try again' as action;

