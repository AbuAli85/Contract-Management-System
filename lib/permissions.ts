import type { Role } from '@/src/components/auth/rbac-provider'

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
  | 'system:restore'

// Define resource types
export type Resource = 'promoter' | 'party' | 'contract' | 'user' | 'system'

// Permission matrix: Role -> Action -> boolean
export const PERMISSIONS: Record<Role, Record<Action, boolean>> = {
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
    'contract:generate': true,
    'contract:approve': true,
    'contract:export': true,
    'contract:archive': true,
    
    // User management - Full access
    'user:create': true,
    'user:read': true,
    'user:update': true,
    'user:delete': true,
    'user:assign_role': true,
    
    // System permissions - Full access
    'system:settings': true,
    'system:analytics': true,
    'system:audit_logs': true,
    'system:notifications': true,
    'system:backup': true,
    'system:restore': true,
  },
  
  manager: {
    // Promoter permissions - Read, Create, Update
    'promoter:create': true,
    'promoter:read': true,
    'promoter:update': true,
    'promoter:delete': false,
    'promoter:bulk_delete': false,
    'promoter:export': true,
    'promoter:archive': true,
    
    // Party permissions - Read, Create, Update
    'party:create': true,
    'party:read': true,
    'party:update': true,
    'party:delete': false,
    'party:bulk_delete': false,
    'party:export': true,
    'party:archive': true,
    
    // Contract permissions - Read, Create, Update, Generate
    'contract:create': true,
    'contract:read': true,
    'contract:update': true,
    'contract:delete': false,
    'contract:generate': true,
    'contract:approve': true,
    'contract:export': true,
    'contract:archive': false,
    
    // User management - Read only
    'user:create': false,
    'user:read': true,
    'user:update': false,
    'user:delete': false,
    'user:assign_role': false,
    
    // System permissions - Limited access
    'system:settings': false,
    'system:analytics': true,
    'system:audit_logs': true,
    'system:notifications': true,
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
    
    // Contract permissions - Read, Create (own contracts)
    'contract:create': true,
    'contract:read': true,
    'contract:update': false,
    'contract:delete': false,
    'contract:generate': false,
    'contract:approve': false,
    'contract:export': false,
    'contract:archive': false,
    
    // User management - No access
    'user:create': false,
    'user:read': false,
    'user:update': false,
    'user:delete': false,
    'user:assign_role': false,
    
    // System permissions - No access
    'system:settings': false,
    'system:analytics': false,
    'system:audit_logs': false,
    'system:notifications': false,
    'system:backup': false,
    'system:restore': false,
  },
}

// Helper functions for permission checking
export function canPerformAction(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.[action] ?? false
}

export function canPerformAnyAction(role: Role, actions: Action[]): boolean {
  return actions.some(action => canPerformAction(role, action))
}

export function canPerformAllActions(role: Role, actions: Action[]): boolean {
  return actions.every(action => canPerformAction(role, action))
}

// Resource-based permission helpers
export function canManageResource(role: Role, resource: Resource): boolean {
  const actions: Action[] = [
    `${resource}:create` as Action,
    `${resource}:read` as Action,
    `${resource}:update` as Action,
    `${resource}:delete` as Action,
  ]
  return canPerformAllActions(role, actions)
}

export function canReadResource(role: Role, resource: Resource): boolean {
  return canPerformAction(role, `${resource}:read` as Action)
}

export function canCreateResource(role: Role, resource: Resource): boolean {
  return canPerformAction(role, `${resource}:create` as Action)
}

export function canUpdateResource(role: Role, resource: Resource): boolean {
  return canPerformAction(role, `${resource}:update` as Action)
}

export function canDeleteResource(role: Role, resource: Resource): boolean {
  return canPerformAction(role, `${resource}:delete` as Action)
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Record<Action, boolean> {
  return PERMISSIONS[role] ?? {}
}

// Get all actions a role can perform
export function getRoleActions(role: Role): Action[] {
  const permissions = getRolePermissions(role)
  return Object.entries(permissions)
    .filter(([, hasPermission]) => hasPermission)
    .map(([action]) => action as Action)
}

// Check if user has any permissions for a resource
export function hasAnyResourcePermission(role: Role, resource: Resource): boolean {
  const resourceActions: Action[] = Object.keys(PERMISSIONS[role] || {})
    .filter(action => action.startsWith(`${resource}:`)) as Action[]
  
  return canPerformAnyAction(role, resourceActions)
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