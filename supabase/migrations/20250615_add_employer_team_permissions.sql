-- ========================================
-- 🛡️ ADD EMPLOYER TEAM MANAGEMENT PERMISSIONS
-- ========================================
-- This migration adds the employer-related permissions required by the team management API
-- These permissions are used by withRBAC and withAnyRBAC guards in /api/employer/team routes
-- 
-- Created: 2025-06-15
-- Purpose: Fix 403 Forbidden errors on /api/employer/team endpoints
-- 
-- Compatible with non-prefixed tables (permissions, roles, role_permissions)
-- ========================================

-- Add employer permissions (idempotent - uses ON CONFLICT)
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    -- Team read permissions
    ('employer', 'read', 'own', 'employer:read:own', 'View own employer team and employees'),
    ('employer', 'read', 'all', 'employer:read:all', 'View all employer teams (admin only)'),
    
    -- Team management permissions
    ('employer', 'manage', 'own', 'employer:manage:own', 'Manage own employer team - add/remove employees, assign permissions'),
    ('employer', 'manage', 'all', 'employer:manage:all', 'Manage all employer teams (admin only)'),
    
    -- Employee self-service permissions
    ('employee', 'read', 'own', 'employee:read:own', 'View own employment details, tasks, targets, attendance')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- ========================================
-- CREATE EMPLOYER ROLE IF NOT EXISTS
-- ========================================

INSERT INTO roles (name, category, description) VALUES
    ('Employer', 'provider', 'Employer who can manage their own team of employees'),
    ('Manager', 'provider', 'Manager with access to team management features')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- ========================================
-- MAP EMPLOYER PERMISSIONS TO ROLES
-- ========================================

DO $$
DECLARE
    employer_role_id UUID;
    manager_role_id UUID;
    admin_role_id UUID;
    perm_employer_read_own UUID;
    perm_employer_read_all UUID;
    perm_employer_manage_own UUID;
    perm_employer_manage_all UUID;
    perm_employee_read_own UUID;
BEGIN
    -- Get role IDs from roles table
    SELECT id INTO employer_role_id FROM roles WHERE name = 'Employer';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager';
    SELECT id INTO admin_role_id FROM roles WHERE name IN ('System Administrator', 'admin', 'super_admin', 'Platform Administrator') LIMIT 1;
    
    -- Get permission IDs
    SELECT id INTO perm_employer_read_own FROM permissions WHERE name = 'employer:read:own';
    SELECT id INTO perm_employer_read_all FROM permissions WHERE name = 'employer:read:all';
    SELECT id INTO perm_employer_manage_own FROM permissions WHERE name = 'employer:manage:own';
    SELECT id INTO perm_employer_manage_all FROM permissions WHERE name = 'employer:manage:all';
    SELECT id INTO perm_employee_read_own FROM permissions WHERE name = 'employee:read:own';
    
    -- Assign to Employer role
    IF employer_role_id IS NOT NULL THEN
        IF perm_employer_read_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (employer_role_id, perm_employer_read_own)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF perm_employer_manage_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (employer_role_id, perm_employer_manage_own)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Assign to Manager role
    IF manager_role_id IS NOT NULL THEN
        IF perm_employer_read_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (manager_role_id, perm_employer_read_own)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF perm_employer_manage_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (manager_role_id, perm_employer_manage_own)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF perm_employee_read_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (manager_role_id, perm_employee_read_own)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Assign all permissions to Admin role
    IF admin_role_id IS NOT NULL THEN
        IF perm_employer_read_all IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_employer_read_all)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF perm_employer_manage_all IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_employer_manage_all)
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Also give admin the own permissions
        IF perm_employer_read_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_employer_read_own)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF perm_employer_manage_own IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_employer_manage_own)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RAISE NOTICE 'Employer permissions assigned to roles successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error assigning employer permissions: %', SQLERRM;
END $$;

-- ========================================
-- GRANT EMPLOYER ROLE TO EXISTING EMPLOYERS
-- ========================================
-- This assigns the Employer role to users who have role = 'employer' or 'manager' in their profile

DO $$
DECLARE
    employer_role_id UUID;
    user_record RECORD;
BEGIN
    -- Get employer role ID
    SELECT id INTO employer_role_id FROM roles WHERE name = 'Employer';
    
    IF employer_role_id IS NULL THEN
        RAISE WARNING 'Employer role not found, skipping user assignment';
        RETURN;
    END IF;
    
    -- Find users who should be employers and assign role via user_role_assignments
    -- Check if user_role_assignments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_role_assignments') THEN
        FOR user_record IN 
            SELECT id FROM profiles 
            WHERE role IN ('employer', 'manager', 'admin')
        LOOP
            INSERT INTO user_role_assignments (user_id, role_id, is_active)
            VALUES (user_record.id, employer_role_id, true)
            ON CONFLICT DO NOTHING;
        END LOOP;
        RAISE NOTICE 'Employer role assigned via user_role_assignments';
    -- Check if rbac_user_role_assignments table exists as fallback
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rbac_user_role_assignments') THEN
        FOR user_record IN 
            SELECT id FROM profiles 
            WHERE role IN ('employer', 'manager', 'admin')
        LOOP
            INSERT INTO rbac_user_role_assignments (user_id, role_id, is_active)
            VALUES (user_record.id, employer_role_id, true)
            ON CONFLICT DO NOTHING;
        END LOOP;
        RAISE NOTICE 'Employer role assigned via rbac_user_role_assignments';
    ELSE
        RAISE WARNING 'No user role assignment table found';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error assigning employer role to users: %', SQLERRM;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================
-- Uncomment to verify:
-- SELECT name, description FROM permissions WHERE resource = 'employer';
-- SELECT name, description FROM permissions WHERE resource = 'employee';
-- SELECT r.name as role, p.name as permission FROM roles r 
-- JOIN role_permissions rp ON rp.role_id = r.id 
-- JOIN permissions p ON p.id = rp.permission_id 
-- WHERE p.name LIKE 'employer:%';
