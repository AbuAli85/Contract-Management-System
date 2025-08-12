import type { EnhancedUserRole } from '@/lib/enhanced-rbac';

// Define all possible actions
export type Action =
  // Promoter actions
  | 'promoter:create'
  | 'promoter:read'
  | 'promoter:update'
  | 'promoter:delete'
  | 'promoter:bulk_delete'
  | 'promoter:export'
  | 'promoter:archive' // <-- new action

  // Party actions
  | 'party:create'
  | 'party:read'
  | 'party:update'
  | 'party:delete'
  | 'party:bulk_delete'
  | 'party:export'
  | 'party:archive' // <-- new action

  // Contract actions
  | 'contract:create'
  | 'contract:read'
  | 'contract:update'
  | 'contract:delete'
  | 'contract:generate'
  | 'contract:approve'
  | 'contract:export'
  | 'contract:archive' // <-- new action

  // User management actions
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'user:assign_role'

  // System actions
  | 'system:settings'
  | 'system:analytics'
  | 'system:audit_logs'
  | 'system:notifications'
  | 'system:backup'
  | 'system:restore';

// Define resource types
export type Resource = 'promoter' | 'party' | 'contract' | 'user' | 'system';

// Permission matrix: Role -> Action -> boolean
export const PERMISSIONS: Record<EnhancedUserRole, Record<Action, boolean>> = {
  super_admin: {
    // Super admin has all permissions
    'promoter:create': true,
    'promoter:read': true,
    'promoter:update': true,
    'promoter:delete': true,
    'promoter:bulk_delete': true,
    'promoter:export': true,
    'promoter:archive': true,
    'party:create': true,
    'party:read': true,
    'party:update': true,
    'party:delete': true,
    'party:bulk_delete': true,
    'party:export': true,
    'party:archive': true,
    'contract:create': true,
    'contract:read': true,
    'contract:update': true,
    'contract:delete': true,
    'contract:bulk_delete': true,
    'contract:export': true,
    'contract:archive': true,
    'system:analytics': true,
    'system:settings': true,
    'system:backup': true,
    'system:restore': true,
  },
  admin: {
    // Promoter permissions - Full access
    'promoter:create': true,
    'promoter:read': true,
    'promoter:update': true,
    'promoter:delete': true,
    'promoter:bulk_delete': true,
    'promoter:export': true,
    'promoter:archive': true,
    // Party permissions - Full access
    'party:create': true,
    'party:read': true,
    'party:update': true,
    'party:delete': true,
    'party:bulk_delete': true,
    'party:export': true,
    'party:archive': true,
    // Contract permissions - Full access
    'contract:create': true,
    'contract:read': true,
    'contract:update': true,
    'contract:delete': true,
    'contract:bulk_delete': true,
    'contract:export': true,
    'contract:archive': true,
    // System permissions - Limited
    'system:analytics': true,
    'system:settings': true,
    'system:backup': false,
    'system:restore': false,
  },
  manager: {
    // Promoter permissions - Read and update
    'promoter:create': true,
    'promoter:read': true,
    'promoter:update': true,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': true,
    'promoter:archive': false,
    // Party permissions - Read and update
    'party:create': true,
    'party:read': true,
    'party:update': true,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': true,
    'party:archive': false,
    // Contract permissions - Read and update
    'contract:create': true,
    'contract:read': true,
    'contract:update': true,
    'contract:delete': false,
    'contract:bulk_delete': false,
    'contract:export': true,
    'contract:archive': false,
    // System permissions - Limited
    'system:analytics': true,
    'system:settings': false,
    'system:backup': false,
    'system:restore': false,
  },
  provider: {
    // Promoter permissions - Limited
    'promoter:create': false,
    'promoter:read': true,
    'promoter:update': false,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': false,
    'promoter:archive': false,
    // Party permissions - Limited
    'party:create': false,
    'party:read': true,
    'party:update': false,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': false,
    'party:archive': false,
    // Contract permissions - Limited
    'contract:create': false,
    'contract:read': true,
    'contract:update': false,
    'contract:delete': false,
    'contract:bulk_delete': false,
    'contract:export': false,
    'contract:archive': false,
    // System permissions - None
    'system:analytics': false,
    'system:settings': false,
    'system:backup': false,
    'system:restore': false,
  },
  client: {
    // Promoter permissions - Limited
    'promoter:create': false,
    'promoter:read': true,
    'promoter:update': false,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': false,
    'promoter:archive': false,
    // Party permissions - Limited
    'party:create': false,
    'party:read': true,
    'party:update': false,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': false,
    'party:archive': false,
    // Contract permissions - Limited
    'contract:create': false,
    'contract:read': true,
    'contract:update': false,
    'contract:delete': false,
    'contract:bulk_delete': false,
    'contract:export': false,
    'contract:archive': false,
    // System permissions - None
    'system:analytics': false,
    'system:settings': false,
    'system:backup': false,
    'system:restore': false,
  },
  user: {
    // Promoter permissions - Read only
    'promoter:create': false,
    'promoter:read': true,
    'promoter:update': false,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': false,
    'promoter:archive': false,
    // Party permissions - Read only
    'party:create': false,
    'party:read': true,
    'party:update': false,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': false,
    'party:archive': false,
    // Contract permissions - Read only
    'contract:create': false,
    'contract:read': true,
    'contract:update': false,
    'contract:delete': false,
    'contract:bulk_delete': false,
    'contract:export': false,
    'contract:archive': false,
    // System permissions - None
    'system:analytics': false,
    'system:settings': false,
    'system:backup': false,
    'system:restore': false,
  },
  viewer: {
    // Promoter permissions - Read only
    'promoter:create': false,
    'promoter:read': true,
    'promoter:update': false,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': false,
    'promoter:archive': false,
    // Party permissions - Read only
    'party:create': false,
    'party:read': true,
    'party:update': false,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': false,
    'party:archive': false,
    // Contract permissions - Read only
    'contract:create': false,
    'contract:read': true,
    'contract:update': false,
    'contract:delete': false,
    'contract:bulk_delete': false,
    'contract:export': false,
    'contract:archive': false,
    // System permissions - None
    'system:analytics': false,
    'system:settings': false,
    'system:backup': false,
    'system:restore': false,
  },
};

// Helper functions for permission checking
export function canPerformAction(
  role: EnhancedUserRole,
  action: Action
): boolean {
  return PERMISSIONS[role]?.[action] ?? false;
}

export function canPerformAnyAction(
  role: EnhancedUserRole,
  actions: Action[]
): boolean {
  return actions.some(action => canPerformAction(role, action));
}

export function canPerformAllActions(
  role: EnhancedUserRole,
  actions: Action[]
): boolean {
  return actions.every(action => canPerformAction(role, action));
}

// Resource-based permission helpers
export function canManageResource(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  const actions: Action[] = [
    `${resource}:create` as Action,
    `${resource}:read` as Action,
    `${resource}:update` as Action,
    `${resource}:delete` as Action,
  ];
  return canPerformAllActions(role, actions);
}

export function canReadResource(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  return canPerformAction(role, `${resource}:read` as Action);
}

export function canCreateResource(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  return canPerformAction(role, `${resource}:create` as Action);
}

export function canUpdateResource(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  return canPerformAction(role, `${resource}:update` as Action);
}

export function canDeleteResource(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  return canPerformAction(role, `${resource}:delete` as Action);
}

// Get all permissions for a role
export function getRolePermissions(
  role: EnhancedUserRole
): Record<Action, boolean> {
  return PERMISSIONS[role] ?? {};
}

// Get all actions a role can perform
export function getRoleActions(role: EnhancedUserRole): Action[] {
  const permissions = getRolePermissions(role);
  return Object.entries(permissions)
    .filter(([, hasPermission]) => hasPermission)
    .map(([action]) => action as Action);
}

// Check if user has any permissions for a resource
export function hasAnyResourcePermission(
  role: EnhancedUserRole,
  resource: Resource
): boolean {
  const resourceActions: Action[] = Object.keys(PERMISSIONS[role] || {}).filter(
    action => action.startsWith(`${resource}:`)
  ) as Action[];

  return canPerformAnyAction(role, resourceActions);
}

export const ACTIONS: Action[] = [
  // Promoter actions
  'promoter:create',
  'promoter:read',
  'promoter:update',
  'promoter:delete',
  'promoter:bulk_delete',
  'promoter:export',
  'promoter:archive',
  // Party actions
  'party:create',
  'party:read',
  'party:update',
  'party:delete',
  'party:bulk_delete',
  'party:export',
  'party:archive',
  // Contract actions
  'contract:create',
  'contract:read',
  'contract:update',
  'contract:delete',
  'contract:generate',
  'contract:approve',
  'contract:export',
  'contract:archive',
  // User management actions
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
  'user:assign_role',
  // System actions
  'system:settings',
  'system:analytics',
  'system:audit_logs',
  'system:notifications',
  'system:backup',
  'system:restore',
];
