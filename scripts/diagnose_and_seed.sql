-- ========================================
-- 🔍 DIAGNOSE AND SEED RBAC
-- ========================================
-- This script diagnoses the issue and then seeds data
-- ========================================

-- STEP 1: Check what tables exist
SELECT 
    'Tables found:' as info,
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name LIKE '%permission%'
OR table_name LIKE '%role%'
ORDER BY table_schema, table_name;

-- STEP 2: Check rbac_permissions structure
SELECT 
    'rbac_permissions structure:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'rbac_permissions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Check rbac_roles structure  
SELECT 
    'rbac_roles structure:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'rbac_roles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 4: Try a simple test insert
DO $$
BEGIN
    -- Test if we can insert into rbac_permissions
    INSERT INTO public.rbac_permissions (resource, action, scope, name, description)
    VALUES ('test', 'test', 'own', 'test:test:own', 'Test permission')
    ON CONFLICT (name) DO NOTHING;
    
    DELETE FROM public.rbac_permissions WHERE name = 'test:test:own';
    
    RAISE NOTICE 'Test insert succeeded!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- STEP 5: Insert roles (with explicit schema)
INSERT INTO public.rbac_roles (name, category, description) VALUES
    ('Basic Client', 'client', 'Basic client with limited booking capabilities'),
    ('Premium Client', 'client', 'Premium client with enhanced features'),
    ('Enterprise Client', 'client', 'Enterprise client with full feature access'),
    ('Individual Provider', 'provider', 'Individual service provider'),
    ('Provider Administrator', 'provider', 'Administrator of provider organization'),
    ('System Administrator', 'admin', 'System-level administrator with full access')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- STEP 6: Insert contract permissions (with explicit schema)
INSERT INTO public.rbac_permissions (resource, action, scope, name, description) VALUES
    ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts'),
    ('contract', 'create', 'own', 'contract:create:own', 'Create own contracts'),
    ('contract', 'update', 'own', 'contract:update:own', 'Update own contracts'),
    ('contract', 'delete', 'own', 'contract:delete:own', 'Delete own contracts'),
    ('contract', 'generate', 'own', 'contract:generate:own', 'Generate own contracts'),
    ('contract', 'download', 'own', 'contract:download:own', 'Download own contracts'),
    ('contract', 'submit', 'own', 'contract:submit:own', 'Submit own contracts for approval'),
    ('contract', 'message', 'own', 'contract:message:own', 'Send messages related to own contracts'),
    ('contract', 'approve', 'all', 'contract:approve:all', 'Approve contracts')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- STEP 7: Insert essential permissions
INSERT INTO public.rbac_permissions (resource, action, scope, name, description) VALUES
    ('user', 'view', 'own', 'user:view:own', 'View own user profile'),
    ('user', 'edit', 'own', 'user:edit:own', 'Edit own user profile'),
    ('user', 'view', 'all', 'user:view:all', 'View all users'),
    ('profile', 'view', 'own', 'profile:view:own', 'View own profile'),
    ('profile', 'edit', 'own', 'profile:edit:own', 'Edit own profile'),
    ('profile', 'read', 'own', 'profile:read:own', 'Read own profile'),
    ('profile', 'update', 'own', 'profile:update:own', 'Update own profile'),
    ('auth', 'login', 'public', 'auth:login:public', 'User login'),
    ('auth', 'logout', 'own', 'auth:logout:own', 'User logout'),
    ('auth', 'refresh', 'own', 'auth:refresh:own', 'Refresh authentication'),
    ('company', 'read', 'own', 'company:read:own', 'Read own company information'),
    ('party', 'read', 'own', 'party:read:own', 'Read own party information'),
    ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter information'),
    ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter information'),
    ('file', 'upload', 'own', 'file:upload:own', 'Upload own files'),
    ('file', 'read', 'own', 'file:read:own', 'Read own files'),
    ('notification', 'read', 'own', 'notification:read:own', 'Read own notifications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- STEP 8: Map permissions to roles
DO $$
DECLARE
    basic_client_id UUID;
    provider_id UUID;
    system_admin_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO basic_client_id FROM public.rbac_roles WHERE name = 'Basic Client';
    SELECT id INTO provider_id FROM public.rbac_roles WHERE name = 'Individual Provider';
    SELECT id INTO system_admin_id FROM public.rbac_roles WHERE name = 'System Administrator';

    -- Basic Client permissions
    IF basic_client_id IS NOT NULL THEN
        INSERT INTO public.rbac_role_permissions (role_id, permission_id)
        SELECT basic_client_id, p.id FROM public.rbac_permissions p WHERE p.name IN (
            'user:view:own', 'user:edit:own',
            'profile:view:own', 'profile:read:own', 'profile:update:own',
            'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
            'contract:read:own', 'contract:create:own', 'contract:update:own',
            'contract:generate:own', 'contract:download:own', 'contract:submit:own',
            'company:read:own', 'party:read:own',
            'file:upload:own', 'file:read:own',
            'notification:read:own'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- Provider permissions
    IF provider_id IS NOT NULL THEN
        INSERT INTO public.rbac_role_permissions (role_id, permission_id)
        SELECT provider_id, p.id FROM public.rbac_permissions p WHERE p.name IN (
            'user:view:own', 'user:edit:own',
            'profile:view:own', 'profile:read:own', 'profile:update:own',
            'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
            'contract:read:own', 'contract:create:own', 'contract:update:own',
            'contract:generate:own', 'contract:download:own', 'contract:submit:own',
            'promoter:read:own', 'promoter:manage:own',
            'company:read:own', 'party:read:own',
            'file:upload:own', 'file:read:own',
            'notification:read:own'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- System Admin: ALL permissions
    IF system_admin_id IS NOT NULL THEN
        INSERT INTO public.rbac_role_permissions (role_id, permission_id)
        SELECT system_admin_id, p.id FROM public.rbac_permissions p
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

END $$;

-- STEP 9: Assign admin role to first user
DO $$
DECLARE
    first_user_id UUID;
    admin_role_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO admin_role_id FROM public.rbac_roles WHERE name = 'System Administrator';
    
    IF first_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO public.rbac_user_role_assignments (user_id, role_id, is_active)
        VALUES (first_user_id, admin_role_id, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Assigned System Administrator role to user: %', first_user_id;
    END IF;
END $$;

-- STEP 10: Refresh materialized view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'rbac_user_permissions_mv') THEN
        PERFORM rbac_refresh_user_permissions_mv();
        RAISE NOTICE 'Materialized view refreshed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not refresh materialized view: %', SQLERRM;
END $$;

-- VERIFICATION
SELECT 
    '✅ FINAL STATUS' as info,
    (SELECT COUNT(*) FROM public.rbac_roles) as roles_count,
    (SELECT COUNT(*) FROM public.rbac_permissions) as permissions_count,
    (SELECT COUNT(*) FROM public.rbac_role_permissions) as role_permission_mappings,
    (SELECT COUNT(*) FROM public.rbac_user_role_assignments WHERE is_active = true) as active_assignments;

-- Show admin user
SELECT 
    '👤 Admin User Assigned' as info,
    u.email,
    r.name as role_name,
    ura.created_at
FROM public.rbac_user_role_assignments ura
JOIN auth.users u ON ura.user_id = u.id
JOIN public.rbac_roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY ura.created_at DESC
LIMIT 5;

-- Show contract permissions
SELECT 
    '🔍 Contract Permissions' as info,
    name,
    description
FROM public.rbac_permissions
WHERE resource = 'contract'
ORDER BY action;

