// ========================================
// 🛡️ RBAC PERMISSION PARSING & VALIDATION
// ========================================

export interface ParsedPermission {
  resource: string;
  action: string;
  scope: string;
  original: string;
}

export type PermissionScope =
  | 'own'
  | 'provider'
  | 'organization'
  | 'public'
  | 'all';

export type PermissionResource =
  | 'user'
  | 'profile'
  | 'auth'
  | 'security'
  | 'service'
  | 'booking'
  | 'communication'
  | 'payment'
  | 'finance'
  | 'role'
  | 'system'
  | 'data'
  | 'analytics'
  | 'notification'
  | 'audit'
  | 'file'
  | 'workflow'
  | 'webhook'
  | 'contract'
  | 'permission'
  | 'promoter'
  | 'party'
  | 'company'
  | 'attendance'
  | 'employer'
  | 'employee';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'read'
  | 'update'
  | 'login'
  | 'logout'
  | 'refresh'
  | 'search'
  | 'browse'
  | 'filter'
  | 'recommend'
  | 'start'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'extend'
  | 'send'
  | 'receive'
  | 'initiate'
  | 'join'
  | 'record'
  | 'process'
  | 'refund'
  | 'export'
  | 'moderate'
  | 'assign'
  | 'revoke'
  | 'settings'
  | 'logs'
  | 'backup'
  | 'maintenance'
  | 'upload'
  | 'download'
  | 'manage'
  | 'submit'
  | 'message'
  | 'approve'
  | 'transition'
  | 'import'
  | 'admin';

// Valid permission scopes
export const VALID_SCOPES: PermissionScope[] = [
  'own',
  'provider',
  'organization',
  'public',
  'all',
];

// Valid permission resources
export const VALID_RESOURCES: PermissionResource[] = [
  'user',
  'profile',
  'auth',
  'security',
  'service',
  'booking',
  'communication',
  'payment',
  'finance',
  'role',
  'system',
  'data',
  'analytics',
  'notification',
  'audit',
  'file',
  'workflow',
  'webhook',
  'contract',
  'permission',
  'promoter',
  'party',
  'company',
  'attendance',
  'employer',
  'employee',
];

// Valid permission actions
export const VALID_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'read',
  'update',
  'login',
  'logout',
  'refresh',
  'search',
  'browse',
  'filter',
  'recommend',
  'start',
  'pause',
  'resume',
  'complete',
  'extend',
  'send',
  'receive',
  'initiate',
  'join',
  'record',
  'process',
  'refund',
  'export',
  'moderate',
  'assign',
  'revoke',
  'settings',
  'logs',
  'backup',
  'maintenance',
  'upload',
  'download',
  'manage',
  'submit',
  'message',
  'approve',
  'transition',
  'import',
  'admin',
];

// Permission parsing function
export function parsePermission(permission: string): ParsedPermission | null {
  try {
    // Handle simple format: "resource.action"
    if (permission.includes('.') && !permission.includes(':')) {
      const [resource, action] = permission.split('.');

      if (!VALID_RESOURCES.includes(resource as PermissionResource)) {
        return null;
      }

      if (!VALID_ACTIONS.includes(action as PermissionAction)) {
        return null;
      }

      return {
        resource: resource as PermissionResource,
        action: action as PermissionAction,
        scope: 'all',
        original: permission,
      };
    }

    // Handle database format: "resource:action:scope" (stored in DB)
    if (permission.includes(':')) {
      const parts = permission.split(':');

      // Format: resource:action:scope
      if (parts.length === 3) {
        const [resource, action, scope] = parts;

        if (!VALID_RESOURCES.includes(resource as PermissionResource)) {
          console.warn(
            `Invalid resource in permission: ${resource} (from ${permission})`
          );
          return null;
        }

        if (!VALID_ACTIONS.includes(action as PermissionAction)) {
          console.warn(
            `Invalid action in permission: ${action} (from ${permission})`
          );
          return null;
        }

        if (!VALID_SCOPES.includes(scope as PermissionScope)) {
          console.warn(
            `Invalid scope in permission: ${scope} (from ${permission})`
          );
          return null;
        }

        return {
          resource: resource as PermissionResource,
          action: action as PermissionAction,
          scope: scope as PermissionScope,
          original: permission,
        };
      }

      // Format: resource.action:scope (alternative format)
      if (parts.length === 2) {
        const [resourceAction, scope] = parts;
        if (!resourceAction) return null;
        const [resource, action] = resourceAction.split('.');

        if (!VALID_RESOURCES.includes(resource as PermissionResource)) {
          return null;
        }

        if (!VALID_ACTIONS.includes(action as PermissionAction)) {
          return null;
        }

        if (!VALID_SCOPES.includes(scope as PermissionScope)) {
          return null;
        }

        return {
          resource: resource as PermissionResource,
          action: action as PermissionAction,
          scope: scope as PermissionScope,
          original: permission,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing permission:', permission, error);
    return null;
  }
}

// Permission validation function
export function validatePermission(permission: string): boolean {
  const parsed = parsePermission(permission);
  return parsed !== null;
}

// Permission comparison function
export function permissionsMatch(
  permission1: string,
  permission2: string
): boolean {
  const parsed1 = parsePermission(permission1);
  const parsed2 = parsePermission(permission2);

  if (!parsed1 || !parsed2) {
    return false;
  }

  return (
    parsed1.resource === parsed2.resource &&
    parsed1.action === parsed2.action &&
    (parsed1.scope === 'all' ||
      parsed2.scope === 'all' ||
      parsed1.scope === parsed2.scope)
  );
}

// Check if permission includes another permission
export function permissionIncludes(
  permission: string,
  requiredPermission: string
): boolean {
  const parsed = parsePermission(permission);
  const required = parsePermission(requiredPermission);

  if (!parsed || !required) {
    return false;
  }

  // Check if resources match
  if (parsed.resource !== required.resource) {
    return false;
  }

  // Check if actions match
  if (parsed.action !== required.action) {
    return false;
  }

  // Check scope hierarchy
  if (parsed.scope === 'all') {
    return true;
  }

  if (required.scope === 'all') {
    return false;
  }

  return parsed.scope === required.scope;
}

// Get all permissions for a role
export function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'contracts.view',
      'contracts.create',
      'contracts.edit',
      'contracts.delete',
      'contracts.approve',
      'dashboard.view',
      'analytics.view',
      'reports.generate',
      'settings.view',
      'settings.edit',
      'logs.view',
      'backup.create',
      'system.manage',
      'security.manage',
      'audit.view',
    ],
    manager: [
      'users.view',
      'users.create',
      'users.edit',
      'contracts.view',
      'contracts.create',
      'contracts.edit',
      'contracts.approve',
      'dashboard.view',
      'analytics.view',
      'reports.generate',
      'settings.view',
      'logs.view',
    ],
    user: [
      'contracts.view',
      'contracts.create',
      'contracts.edit',
      'dashboard.view',
      'profile.edit',
    ],
    viewer: ['contracts.view', 'dashboard.view'],
  };

  return rolePermissions[role] || [];
}

// Check if user has permission based on role
export function hasPermission(role: string, permission: string): boolean {
  const rolePermissions = getRolePermissions(role);
  return rolePermissions.some(rolePermission =>
    permissionIncludes(rolePermission, permission)
  );
}

// Get effective permissions for a user with multiple roles
export function getEffectivePermissions(roles: string[]): string[] {
  const allPermissions = new Set<string>();

  roles.forEach(role => {
    const rolePermissions = getRolePermissions(role);
    rolePermissions.forEach(permission => {
      allPermissions.add(permission);
    });
  });

  return Array.from(allPermissions);
}

// Export default permissions for common operations
export const DEFAULT_PERMISSIONS = {
  // User management
  USER_VIEW: 'users.view',
  USER_CREATE: 'users.create',
  USER_EDIT: 'users.edit',
  USER_DELETE: 'users.delete',

  // Contract management
  CONTRACT_VIEW: 'contracts.view',
  CONTRACT_CREATE: 'contracts.create',
  CONTRACT_EDIT: 'contracts.edit',
  CONTRACT_DELETE: 'contracts.delete',
  CONTRACT_APPROVE: 'contracts.approve',

  // Dashboard and analytics
  DASHBOARD_VIEW: 'dashboard.view',
  ANALYTICS_VIEW: 'analytics.view',
  REPORTS_GENERATE: 'reports.generate',

  // System administration
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  LOGS_VIEW: 'logs.view',
  BACKUP_CREATE: 'backup.create',

  // Security and audit
  SECURITY_MANAGE: 'security.manage',
  AUDIT_VIEW: 'audit.view',
  SYSTEM_MANAGE: 'system.manage',
};
