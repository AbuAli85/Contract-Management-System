-- ========================================
-- 🚀 QUICK FIX: Add party:read:own Permission
-- ========================================
-- Run this in Supabase SQL Editor to immediately fix the permission error
-- Safe to run multiple times (idempotent)

-- Step 1: Ensure the permission exists
INSERT INTO permissions (id, resource, action, scope, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'party',
    'read',
    'own',
    'party:read:own',
    'Read own party information',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Grant party:read:own to all standard user roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'party:read:own'
AND r.name IN (
    'Basic Client',
    'Premium Client', 
    'Enterprise Client',
    'Individual Provider',
    'Provider Team Member',
    'Provider Manager',
    'Operations Manager',
    'System Administrator',
    'Platform Administrator'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 3: Clear permission cache (if using caching)
-- This will force the system to reload permissions from the database
NOTIFY permission_cache_invalidate;

-- Step 4: Verify the permissions were added successfully
SELECT 
    r.name as role_name,
    r.category as role_category,
    p.name as permission_name,
    p.description as permission_description,
    COUNT(*) OVER (PARTITION BY r.id) as total_permissions_for_role
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'party:read:own'
ORDER BY r.category, r.name;

-- Step 5: Check which users are affected (for verification)
SELECT 
    u.email,
    r.name as assigned_role,
    ura.is_active,
    CASE 
        WHEN rp.permission_id IS NOT NULL THEN '✅ Has Permission'
        ELSE '❌ Missing Permission'
    END as permission_status
FROM auth.users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name = 'party:read:own'
ORDER BY u.created_at DESC
LIMIT 20;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ party:read:own permission has been added to all standard roles!';
    RAISE NOTICE '🔄 Users may need to log out and log back in for changes to take effect.';
END $$;

