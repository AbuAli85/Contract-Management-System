-- ========================================
-- 🛡️ RBAC SEED DATA
-- ========================================
-- This script seeds the RBAC system with comprehensive roles and permissions
-- All operations are idempotent and safe to re-run

-- ========================================
-- INSERT ROLES (idempotent)
-- ========================================

-- Client Roles
INSERT INTO roles (name, category, description) VALUES
    ('Basic Client', 'client', 'Basic client with limited booking capabilities'),
    ('Premium Client', 'client', 'Premium client with enhanced features'),
    ('Enterprise Client', 'client', 'Enterprise client with full feature access'),
    ('Client Administrator', 'client', 'Client organization administrator')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- Provider Roles
INSERT INTO roles (name, category, description) VALUES
    ('Individual Provider', 'provider', 'Individual service provider'),
    ('Provider Team Member', 'provider', 'Member of a provider team'),
    ('Provider Manager', 'provider', 'Manager of provider team or organization'),
    ('Provider Administrator', 'provider', 'Administrator of provider organization')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- Admin Roles
INSERT INTO roles (name, category, description) VALUES
    ('Support Agent', 'admin', 'Customer support agent'),
    ('Content Moderator', 'admin', 'Content moderation specialist'),
    ('Platform Administrator', 'admin', 'Platform-level administrator'),
    ('System Administrator', 'admin', 'System-level administrator with full access')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = now();

-- ========================================
-- INSERT PERMISSIONS (idempotent)
-- ========================================

-- User & Profile Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('user', 'view', 'own', 'user:view:own', 'View own user profile'),
    ('user', 'edit', 'own', 'user:edit:own', 'Edit own user profile'),
    ('user', 'view', 'all', 'user:view:all', 'View all users'),
    ('user', 'create', 'all', 'user:create:all', 'Create new users'),
    ('user', 'edit', 'all', 'user:edit:all', 'Edit any user'),
    ('user', 'delete', 'all', 'user:delete:all', 'Delete users'),
    ('profile', 'view', 'own', 'profile:view:own', 'View own profile'),
    ('profile', 'edit', 'own', 'profile:edit:own', 'Edit own profile'),
    ('profile', 'view', 'all', 'profile:view:all', 'View all profiles')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Add missing permissions for RBAC implementation
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    -- System & Data Management
    ('system', 'backup', 'all', 'system:backup:all', 'Create system backups'),
    ('data', 'import', 'all', 'data:import:all', 'Import data into the system'),
    ('data', 'seed', 'all', 'data:seed:all', 'Seed system with initial data'),
    ('role', 'update', 'all', 'role:update:all', 'Update role definitions and assignments'),
    
    -- Profile Management (canonical keys)
    ('profile', 'read', 'own', 'profile:read:own', 'Read own profile'),
    ('profile', 'read', 'all', 'profile:read:all', 'Read all profiles'),
    ('profile', 'update', 'own', 'profile:update:own', 'Update own profile'),
    ('profile', 'update', 'all', 'profile:update:all', 'Update any profile'),
    
    -- Contract Operations
    ('contract', 'approve', 'all', 'contract:approve:all', 'Approve contracts'),
    ('contract', 'generate', 'own', 'contract:generate:own', 'Generate own contracts'),
    ('contract', 'download', 'own', 'contract:download:own', 'Download own contracts'),
    
    -- Company & Organization Management
    ('company', 'read', 'own', 'company:read:own', 'Read own company information'),
    ('company', 'read', 'organization', 'company:read:organization', 'Read organization company information'),
    ('company', 'read', 'all', 'company:read:all', 'Read all company information'),
    ('company', 'manage', 'all', 'company:manage:all', 'Manage all companies'),
    
    -- Party Management
    ('party', 'read', 'own', 'party:read:own', 'Read own party information'),
    
    -- Promoter Management
    ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoter information'),
    ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoter information'),
    
    -- Analytics & Dashboard
    ('analytics', 'read', 'all', 'analytics:read:all', 'Read analytics data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Authentication & Security
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('auth', 'login', 'public', 'auth:login:public', 'User login'),
    ('auth', 'logout', 'own', 'auth:logout:own', 'User logout'),
    ('auth', 'refresh', 'own', 'auth:refresh:own', 'Refresh authentication'),
    ('auth', 'impersonate', 'all', 'auth:impersonate:all', 'Impersonate other users'),
    ('security', 'mfa', 'own', 'security:mfa:own', 'Manage own MFA'),
    ('security', 'mfa', 'all', 'security:mfa:all', 'Manage MFA for any user')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Service Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('service', 'view', 'public', 'service:view:public', 'View public services'),
    ('service', 'view', 'own', 'service:view:own', 'View own services'),
    ('service', 'view', 'provider', 'service:view:provider', 'View provider services'),
    ('service', 'view', 'all', 'service:view:all', 'View all services'),
    ('service', 'create', 'own', 'service:create:own', 'Create own services'),
    ('service', 'edit', 'own', 'service:edit:own', 'Edit own services'),
    ('service', 'delete', 'own', 'service:delete:own', 'Delete own services'),
    ('service', 'moderate', 'all', 'service:moderate:all', 'Moderate all services')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Service Discovery
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('discovery', 'search', 'public', 'discovery:search:public', 'Search for services'),
    ('discovery', 'browse', 'public', 'discovery:browse:public', 'Browse available services'),
    ('discovery', 'filter', 'public', 'discovery:filter:public', 'Filter services'),
    ('discovery', 'recommend', 'own', 'discovery:recommend:own', 'Get personalized recommendations')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Booking Management
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('booking', 'view', 'own', 'booking:view:own', 'View own bookings'),
    ('booking', 'view', 'provider', 'booking:view:provider', 'View provider bookings'),
    ('booking', 'view', 'all', 'booking:view:all', 'View all bookings'),
    ('booking', 'create', 'own', 'booking:create:own', 'Create new bookings'),
    ('booking', 'edit', 'own', 'booking:edit:own', 'Edit own bookings'),
    ('booking', 'edit', 'provider', 'booking:edit:provider', 'Edit provider bookings'),
    ('booking', 'cancel', 'own', 'booking:cancel:own', 'Cancel own bookings'),
    ('booking', 'cancel', 'provider', 'booking:cancel:provider', 'Cancel provider bookings'),
    ('booking', 'approve', 'provider', 'booking:approve:provider', 'Approve bookings'),
    ('booking', 'reject', 'provider', 'booking:reject:provider', 'Reject bookings')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Booking Lifecycle
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('booking_lifecycle', 'start', 'provider', 'booking_lifecycle:start:provider', 'Start a booking session'),
    ('booking_lifecycle', 'pause', 'provider', 'booking_lifecycle:pause:provider', 'Pause a booking session'),
    ('booking_lifecycle', 'resume', 'provider', 'booking_lifecycle:resume:provider', 'Resume a booking session'),
    ('booking_lifecycle', 'complete', 'provider', 'booking_lifecycle:complete:provider', 'Complete a booking session'),
    ('booking_lifecycle', 'extend', 'provider', 'booking_lifecycle:extend:provider', 'Extend a booking session')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Communication
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('communication', 'send', 'own', 'communication:send:own', 'Send messages'),
    ('communication', 'receive', 'own', 'communication:receive:own', 'Receive messages'),
    ('communication', 'view', 'own', 'communication:view:own', 'View own communications'),
    ('communication', 'view', 'provider', 'communication:view:provider', 'View provider communications'),
    ('communication', 'moderate', 'all', 'communication:moderate:all', 'Moderate all communications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Calls
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('call', 'initiate', 'own', 'call:initiate:own', 'Initiate calls'),
    ('call', 'join', 'own', 'call:join:own', 'Join calls'),
    ('call', 'record', 'provider', 'call:record:provider', 'Record calls'),
    ('call', 'view', 'own', 'call:view:own', 'View own call history'),
    ('call', 'view', 'provider', 'call:view:provider', 'View provider call history')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Payments & Finance
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('payment', 'view', 'own', 'payment:view:own', 'View own payments'),
    ('payment', 'view', 'provider', 'payment:view:provider', 'View provider payments'),
    ('payment', 'view', 'all', 'payment:view:all', 'View all payments'),
    ('payment', 'process', 'provider', 'payment:process:provider', 'Process payments'),
    ('payment', 'refund', 'provider', 'payment:refund:provider', 'Process refunds'),
    ('finance', 'view', 'own', 'finance:view:own', 'View own financial data'),
    ('finance', 'view', 'provider', 'finance:view:provider', 'View provider financial data'),
    ('finance', 'view', 'all', 'finance:view:all', 'View all financial data'),
    ('finance', 'export', 'own', 'finance:export:own', 'Export own financial data'),
    ('finance', 'export', 'provider', 'finance:export:provider', 'Export provider financial data')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Role Administration
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('role', 'view', 'all', 'role:view:all', 'View all roles'),
    ('role', 'create', 'all', 'role:create:all', 'Create new roles'),
    ('role', 'edit', 'all', 'role:edit:all', 'Edit roles'),
    ('role', 'delete', 'all', 'role:delete:all', 'Delete roles'),
    ('role', 'assign', 'all', 'role:assign:all', 'Assign roles to users'),
    ('role', 'revoke', 'all', 'role:revoke:all', 'Revoke roles from users')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- System Administration
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('system', 'view', 'all', 'system:view:all', 'View system information'),
    ('system', 'settings', 'all', 'system:settings:all', 'Manage system settings'),
    ('system', 'logs', 'all', 'system:logs:all', 'View system logs'),
    ('system', 'backup', 'all', 'system:backup:all', 'Create system backups'),
    ('system', 'maintenance', 'all', 'system:maintenance:all', 'Perform system maintenance')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Webhooks (note: still require signature validation)
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('webhook', 'ingest', 'public', 'webhook:ingest:public', 'Receive webhook data from external systems')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Notifications
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('notification', 'create', 'own', 'notification:create:own', 'Create own notifications'),
    ('notification', 'read', 'own', 'notification:read:own', 'Read own notifications'),
    ('notification', 'update', 'own', 'notification:update:own', 'Update own notifications'),
    ('notification', 'delete', 'own', 'notification:delete:own', 'Delete own notifications'),
    ('notification', 'read', 'organization', 'notification:read:organization', 'Read organization notifications'),
    ('notification', 'create', 'provider', 'notification:create:provider', 'Send notifications to provider clients'),
    ('notification', 'manage', 'all', 'notification:manage:all', 'Manage all notifications')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Audit Logs
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('audit', 'read', 'all', 'audit:read:all', 'Read audit logs')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Uploads / Files
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('file', 'upload', 'own', 'file:upload:own', 'Upload own files'),
    ('file', 'read', 'own', 'file:read:own', 'Read own files'),
    ('file', 'delete', 'own', 'file:delete:own', 'Delete own files'),
    ('file', 'manage', 'all', 'file:manage:all', 'Manage all files')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Workflow
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('workflow', 'start', 'own', 'workflow:start:own', 'Start own workflows'),
    ('workflow', 'transition', 'organization', 'workflow:transition:organization', 'Transition organization workflows'),
    ('workflow', 'approve', 'all', 'workflow:approve:all', 'Approve workflows')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Contracts (extras)
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('contract', 'read', 'own', 'contract:read:own', 'Read own contracts'),
    ('contract', 'create', 'own', 'contract:create:own', 'Create own contracts'),
    ('contract', 'update', 'own', 'contract:update:own', 'Update own contracts'),
    ('contract', 'delete', 'own', 'contract:delete:own', 'Delete own contracts'),
    ('contract', 'submit', 'own', 'contract:submit:own', 'Submit own contracts for approval'),
    ('contract', 'message', 'own', 'contract:message:own', 'Send messages related to own contracts'),
    ('contract', 'read', 'paginated', 'contract:read:paginated:own', 'Read paginated own contracts')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- Users (extras)
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('user', 'approve', 'all', 'user:approve:all', 'Approve user registrations'),
    ('permission', 'manage', 'all', 'permission:manage:all', 'Manage system permissions')
ON CONFLICT (name) DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

-- ========================================
-- MAP ROLES TO PERMISSIONS (idempotent)
-- ========================================

-- Get role IDs for mapping
DO $$
DECLARE
    basic_client_id UUID;
    premium_client_id UUID;
    enterprise_client_id UUID;
    client_admin_id UUID;
    individual_provider_id UUID;
    provider_team_member_id UUID;
    provider_manager_id UUID;
    provider_admin_id UUID;
    support_agent_id UUID;
    content_moderator_id UUID;
    platform_admin_id UUID;
    system_admin_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO basic_client_id FROM roles WHERE name = 'Basic Client';
    SELECT id INTO premium_client_id FROM roles WHERE name = 'Premium Client';
    SELECT id INTO enterprise_client_id FROM roles WHERE name = 'Enterprise Client';
    SELECT id INTO client_admin_id FROM roles WHERE name = 'Client Administrator';
    SELECT id INTO individual_provider_id FROM roles WHERE name = 'Individual Provider';
    SELECT id INTO provider_team_member_id FROM roles WHERE name = 'Provider Team Member';
    SELECT id INTO provider_manager_id FROM roles WHERE name = 'Provider Manager';
    SELECT id INTO provider_admin_id FROM roles WHERE name = 'Provider Administrator';
    SELECT id INTO support_agent_id FROM roles WHERE name = 'Support Agent';
    SELECT id INTO content_moderator_id FROM roles WHERE name = 'Content Moderator';
    SELECT id INTO platform_admin_id FROM roles WHERE name = 'Platform Administrator';
    SELECT id INTO system_admin_id FROM roles WHERE name = 'System Administrator';

    -- Basic Client permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT basic_client_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:public', 'discovery:search:public', 'discovery:browse:public',
        'discovery:filter:public', 'discovery:recommend:own',
        'booking:view:own', 'booking:create:own', 'booking:edit:own', 'booking:cancel:own',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'call:initiate:own', 'call:join:own', 'call:view:own',
        'payment:view:own', 'finance:view:own', 'finance:export:own',
        'company:read:own', 'party:read:own', 'contract:read:own', 'contract:create:own', 
        'contract:update:own', 'contract:generate:own', 'contract:download:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own',
        'workflow:start:own', 'contract:submit:own', 'contract:message:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Premium Client permissions (includes Basic + additional)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT premium_client_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:public', 'discovery:search:public', 'discovery:browse:public',
        'discovery:filter:public', 'discovery:recommend:own',
        'booking:view:own', 'booking:create:own', 'booking:edit:own', 'booking:cancel:own',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'call:initiate:own', 'call:join:own', 'call:view:own',
        'payment:view:own', 'finance:view:own', 'finance:export:own',
        'security:mfa:own', 'company:read:own', 'party:read:own', 'contract:read:own', 
        'contract:create:own', 'contract:update:own', 'contract:generate:own', 'contract:download:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own',
        'workflow:start:own', 'contract:submit:own', 'contract:message:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Enterprise Client permissions (includes Premium + additional)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT enterprise_client_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:public', 'discovery:search:public', 'discovery:browse:public',
        'discovery:filter:public', 'discovery:recommend:own',
        'booking:view:own', 'booking:create:own', 'booking:edit:own', 'booking:cancel:own',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'call:initiate:own', 'call:join:own', 'call:view:own',
        'payment:view:own', 'finance:view:own', 'finance:export:own',
        'security:mfa:own', 'user:view:all', 'profile:view:all', 'profile:read:all',
        'company:read:own', 'company:read:organization', 'party:read:own', 'contract:read:own',
        'contract:create:own', 'contract:update:own', 'contract:generate:own', 'contract:download:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own',
        'workflow:start:own', 'contract:submit:own', 'contract:message:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Client Administrator permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT client_admin_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:public', 'discovery:search:public', 'discovery:browse:public',
        'discovery:filter:public', 'discovery:recommend:own',
        'booking:view:own', 'booking:create:own', 'booking:edit:own', 'booking:cancel:own',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'call:initiate:own', 'call:join:own', 'call:view:own',
        'payment:view:own', 'finance:view:own', 'finance:export:own',
        'security:mfa:own', 'user:view:all', 'user:create:all', 'user:edit:all',
        'profile:view:all', 'profile:edit:all', 'profile:read:all', 'profile:update:all',
        'company:read:organization', 'party:read:own', 'notification:read:organization',
        'workflow:transition:organization'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Individual Provider permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT individual_provider_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:own', 'service:create:own', 'service:edit:own', 'service:delete:own',
        'service:view:public', 'discovery:search:public', 'discovery:browse:public',
        'booking:view:own', 'booking:view:provider', 'booking:edit:provider',
        'booking:approve:provider', 'booking:reject:provider',
        'booking_lifecycle:start:provider', 'booking_lifecycle:pause:provider',
        'booking_lifecycle:resume:provider', 'booking_lifecycle:complete:provider',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'communication:view:provider', 'call:initiate:own', 'call:join:own',
        'call:view:own', 'call:view:provider', 'call:record:provider',
        'payment:view:provider', 'finance:view:own', 'finance:export:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own', 
        'contract:generate:own', 'contract:download:own', 'promoter:read:own', 'promoter:manage:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own',
        'workflow:start:own', 'contract:submit:own', 'contract:message:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Provider Team Member permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT provider_team_member_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:own', 'service:view:provider', 'discovery:search:public',
        'discovery:browse:public', 'booking:view:own', 'booking:view:provider',
        'booking:edit:provider', 'booking:approve:provider', 'booking:reject:provider',
        'booking_lifecycle:start:provider', 'booking_lifecycle:pause:provider',
        'booking_lifecycle:resume:provider', 'booking_lifecycle:complete:provider',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'communication:view:provider', 'call:initiate:own', 'call:join:own',
        'call:view:own', 'call:view:provider', 'call:record:provider',
        'payment:view:provider', 'finance:view:own',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:generate:own', 'contract:download:own', 'promoter:read:own',
        'file:upload:own', 'file:read:own', 'file:delete:own',
        'notification:create:own', 'notification:read:own', 'notification:update:own', 'notification:delete:own',
        'workflow:start:own', 'contract:submit:own', 'contract:message:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Provider Manager permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT provider_manager_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:own', 'service:create:own', 'service:edit:own', 'service:delete:own',
        'service:view:provider', 'service:view:all', 'discovery:search:public',
        'discovery:browse:public', 'booking:view:own', 'booking:view:provider',
        'booking:edit:provider', 'booking:approve:provider', 'booking:reject:provider',
        'booking_lifecycle:start:provider', 'booking_lifecycle:pause:provider',
        'booking_lifecycle:resume:provider', 'booking_lifecycle:complete:provider',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'communication:view:provider', 'call:initiate:own', 'call:join:own',
        'call:view:own', 'call:view:provider', 'call:record:provider',
        'payment:view:provider', 'payment:process:provider', 'payment:refund:provider',
        'finance:view:own', 'finance:view:provider', 'finance:export:provider',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:approve:all', 'contract:generate:own', 'contract:download:own',
        'promoter:read:own', 'promoter:manage:own', 'notification:create:provider'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Provider Administrator permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT provider_admin_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:own', 'user:edit:own', 'profile:view:own', 'profile:edit:own',
        'profile:read:own', 'profile:update:own',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:own', 'service:create:own', 'service:edit:own', 'service:delete:own',
        'service:view:provider', 'service:view:all', 'discovery:search:public',
        'discovery:browse:public', 'booking:view:own', 'booking:view:provider',
        'booking:edit:provider', 'booking:approve:provider', 'booking:reject:provider',
        'booking_lifecycle:start:provider', 'booking_lifecycle:pause:provider',
        'booking_lifecycle:resume:provider', 'booking_lifecycle:complete:provider',
        'communication:send:own', 'communication:receive:own', 'communication:view:own',
        'communication:view:provider', 'call:initiate:own', 'call:join:own',
        'call:view:own', 'call:view:provider', 'call:record:provider',
        'payment:view:provider', 'payment:process:provider', 'payment:refund:provider',
        'finance:view:own', 'finance:view:provider', 'finance:export:provider',
        'user:view:provider', 'user:create:all', 'user:edit:provider',
        'contract:read:own', 'contract:create:own', 'contract:update:own',
        'contract:approve:all', 'contract:generate:own', 'contract:download:own',
        'promoter:read:own', 'promoter:manage:own', 'notification:create:provider'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Support Agent permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT support_agent_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:all', 'user:edit:all', 'profile:view:all', 'profile:edit:all',
        'profile:read:all', 'profile:update:all',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own',
        'service:view:all', 'discovery:search:public', 'discovery:browse:public',
        'booking:view:all', 'communication:view:all', 'call:view:all',
        'payment:view:all', 'finance:view:all', 'system:view:all',
        'company:read:all', 'party:read:own', 'promoter:read:own'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Content Moderator permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT content_moderator_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:all', 'profile:view:all', 'profile:read:all',
        'auth:login:public', 'auth:logout:own',
        'service:view:all', 'service:moderate:all', 'discovery:search:public',
        'discovery:browse:public', 'communication:view:all', 'communication:moderate:all',
        'system:view:all', 'company:read:all'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Platform Administrator permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT platform_admin_id, p.id FROM permissions p WHERE p.name IN (
        'user:view:all', 'user:create:all', 'user:edit:all', 'user:delete:all',
        'profile:view:all', 'profile:edit:all', 'profile:read:all', 'profile:update:all',
        'auth:login:public', 'auth:logout:own', 'auth:refresh:own', 'auth:impersonate:all', 'security:mfa:all',
        'service:view:all', 'service:moderate:all', 'discovery:search:public',
        'discovery:browse:public', 'booking:view:all', 'communication:view:all',
        'communication:moderate:all', 'call:view:all', 'payment:view:all',
        'finance:view:all', 'finance:export:all', 'role:view:all', 'role:create:all',
        'role:edit:all', 'role:delete:all', 'role:assign:all', 'role:revoke:all',
        'role:update:all', 'system:view:all', 'system:settings:all', 'system:logs:all',
        'company:read:all', 'company:manage:all', 'party:read:own', 'promoter:read:own',
        'analytics:read:all', 'audit:read:all', 'file:manage:all', 'notification:manage:all',
        'workflow:approve:all', 'permission:manage:all', 'user:approve:all'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- System Administrator permissions (all permissions)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT system_admin_id, p.id FROM permissions p
    ON CONFLICT (role_id, permission_id) DO NOTHING;

END $$;

-- ========================================
-- REFRESH MATERIALIZED VIEW
-- ========================================
SELECT refresh_user_permissions();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Uncomment to verify the setup:

-- SELECT 'Roles created:' as info, COUNT(*) as count FROM roles;
-- SELECT 'Permissions created:' as info, COUNT(*) as count FROM permissions;
-- SELECT 'Role-permission mappings:' as info, COUNT(*) as count FROM role_permissions;

-- SELECT 'Basic Client permissions:' as info, COUNT(*) as count 
-- FROM role_permissions rp 
-- JOIN roles r ON rp.role_id = r.id 
-- WHERE r.name = 'Basic Client';

-- SELECT 'System Administrator permissions:' as info, COUNT(*) as count 
-- FROM role_permissions rp 
-- JOIN roles r ON rp.role_id = r.id 
-- WHERE r.name = 'System Administrator';
