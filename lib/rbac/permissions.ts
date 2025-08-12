<<<<<<< Updated upstream
// ========================================
// 🛡️ RBAC PERMISSION PARSING & VALIDATION
// ========================================

export interface ParsedPermission {
  resource: string
  action: string
  scope: string
  original: string
}

export type PermissionScope = 'own' | 'provider' | 'organization' | 'booking' | 'public' | 'all'

export type PermissionResource = 
  | 'user' | 'profile' | 'auth' | 'security'
  | 'service' | 'discovery' | 'booking' | 'booking_lifecycle'
  | 'communication' | 'call' | 'payment' | 'finance'
  | 'role' | 'system' | 'data' | 'analytics'
  | 'notification' | 'audit' | 'file' | 'workflow'
  | 'webhook' | 'contract' | 'permission'

export type PermissionAction = 
  | 'view' | 'create' | 'edit' | 'delete' | 'read' | 'update'
  | 'login' | 'logout' | 'refresh' | 'impersonate'
  | 'search' | 'browse' | 'filter' | 'recommend'
  | 'start' | 'pause' | 'resume' | 'complete' | 'extend'
  | 'send' | 'receive' | 'initiate' | 'join' | 'record'
  | 'process' | 'refund' | 'export' | 'moderate'
  | 'assign' | 'revoke' | 'settings' | 'logs' | 'backup' | 'maintenance'
  | 'upload' | 'download' | 'manage' | 'submit' | 'message'
  | 'approve' | 'transition' | 'ingest' | 'seed' | 'import'

// Valid permission scopes
export const VALID_SCOPES: PermissionScope[] = ['own', 'provider', 'organization', 'booking', 'public', 'all']

// Valid permission resources
export const VALID_RESOURCES: PermissionResource[] = [
  'user', 'profile', 'auth', 'security',
  'service', 'discovery', 'booking', 'booking_lifecycle',
  'communication', 'call', 'payment', 'finance',
  'role', 'system', 'data', 'analytics',
  'notification', 'audit', 'file', 'workflow',
  'webhook', 'contract', 'permission'
]

// Valid permission actions
export const VALID_ACTIONS: PermissionAction[] = [
  'view', 'create', 'edit', 'delete', 'read', 'update',
  'login', 'logout', 'refresh', 'impersonate',
  'search', 'browse', 'filter', 'recommend',
  'start', 'pause', 'resume', 'complete', 'extend',
  'send', 'receive', 'initiate', 'join', 'record',
  'process', 'refund', 'export', 'moderate',
  'assign', 'revoke', 'settings', 'logs', 'backup', 'maintenance',
  'upload', 'download', 'manage', 'submit', 'message',
  'approve', 'transition', 'ingest', 'seed', 'import'
]

/**
 * Parse a permission string into its components
 * Format: {resource}:{action}:{scope}
 * 
 * @param permission - Permission string to parse
 * @returns ParsedPermission object or null if invalid
 */
export function parsePermission(permission: string): ParsedPermission | null {
  if (!permission || typeof permission !== 'string') {
    return null
  }

  const parts = permission.split(':')
  if (parts.length !== 3) {
    return null
  }

  const [resource, action, scope] = parts

  // Validate each component
  if (!isValidResource(resource) || !isValidAction(action) || !isValidScope(scope)) {
    return null
  }

  return {
    resource: resource as PermissionResource,
    action: action as PermissionAction,
    scope: scope as PermissionScope,
    original: permission
  }
}

/**
 * Validate if a resource is valid
 */
export function isValidResource(resource: string): resource is PermissionResource {
  return VALID_RESOURCES.includes(resource as PermissionResource)
}

/**
 * Validate if an action is valid
 */
export function isValidAction(action: string): action is PermissionAction {
  return VALID_ACTIONS.includes(action as PermissionAction)
}

/**
 * Validate if a scope is valid
 */
export function isValidScope(scope: string): scope is PermissionScope {
  return VALID_SCOPES.includes(scope as PermissionScope)
}

/**
 * Validate a complete permission string
 */
export function isValidPermission(permission: string): boolean {
  return parsePermission(permission) !== null
}

/**
 * Create a permission string from components
 */
export function createPermission(
  resource: PermissionResource,
  action: PermissionAction,
  scope: PermissionScope
): string {
  return `${resource}:${action}:${scope}`
}

/**
 * Check if a permission matches a pattern
 * Pattern can use wildcards (*) for any component
 */
export function permissionMatches(pattern: string, permission: string): boolean {
  if (!pattern || !permission) return false

  const patternParts = pattern.split(':')
  const permissionParts = permission.split(':')

  if (patternParts.length !== 3 || permissionParts.length !== 3) {
    return false
  }

  return patternParts.every((part, index) => {
    if (part === '*') return true
    return part === permissionParts[index]
  })
}

/**
 * Get all permissions that match a pattern
 */
export function getMatchingPermissions(
  pattern: string,
  permissions: string[]
): string[] {
  return permissions.filter(permission => permissionMatches(pattern, permission))
}

/**
 * Check if a user has any permission that matches a pattern
 */
export function hasMatchingPermission(
  userPermissions: string[],
  pattern: string
): boolean {
  return getMatchingPermissions(pattern, userPermissions).length > 0
}

/**
 * Get the highest scope level from a list of permissions
 * Scope hierarchy: public < own < booking < organization < provider < all
 */
export function getHighestScope(permissions: string[]): PermissionScope {
  const scopeHierarchy: Record<PermissionScope, number> = {
    'public': 1,
    'own': 2,
    'booking': 3,
    'organization': 4,
    'provider': 5,
    'all': 6
  }

  let highestScope: PermissionScope = 'public'
  let highestLevel = 1

  for (const permission of permissions) {
    const parsed = parsePermission(permission)
    if (parsed && scopeHierarchy[parsed.scope] > highestLevel) {
      highestLevel = scopeHierarchy[parsed.scope]
      highestScope = parsed.scope
    }
  }

  return highestScope
}

/**
 * Check if a scope is sufficient for a required scope
 */
export function scopeIsSufficient(
  userScope: PermissionScope,
  requiredScope: PermissionScope
): boolean {
  const scopeHierarchy: Record<PermissionScope, number> = {
    'public': 1,
    'own': 2,
    'booking': 3,
    'organization': 4,
    'provider': 5,
    'all': 6
  }

  return scopeHierarchy[userScope] >= scopeHierarchy[requiredScope]
}

/**
 * Normalize a permission string (lowercase, trim) and handle legacy aliases
 * Converts legacy permission keys to canonical format {resource}:{action}:{scope}
 */
export function normalizePermission(permission: string): string {
  const normalized = permission.toLowerCase().trim()
  
  // Legacy permission aliases mapping to canonical format
  const permissionAliases: Record<string, string> = {
    // Dashboard aliases
    'dashboard:analytics:read': 'analytics:read:all',
    
    // Admin aliases
    'admin:backup:all': 'system:backup:all',
    'admin:import:all': 'data:import:all',
    'admin:seed:all': 'data:seed:all',
    'admin:roles:update:all': 'role:update:all',
    
    // Notification aliases
    'notification:send:own': 'notification:create:own',
    'notification:send:provider': 'notification:create:provider',
    
    // Audit aliases
    'audit-logs:view:all': 'audit:read:all',
    
    // Upload aliases
    'upload:*:*': 'file:*:*',
    
    // Workflow aliases
    'workflow:move:organization': 'workflow:transition:organization',
    
    // Webhook aliases
    'webhook:receive:public': 'webhook:ingest:public'
  }
  
  // Check for exact alias matches first
  if (permissionAliases[normalized]) {
    return permissionAliases[normalized]
  }
  
  // Handle wildcard patterns
  for (const [pattern, canonical] of Object.entries(permissionAliases)) {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*')
      if (new RegExp(`^${regexPattern}$`).test(normalized)) {
        return canonical.replace(/\*/g, normalized.split(':')[normalized.split(':').indexOf('*')])
      }
    }
  }
  
  return normalized
}

/**
 * Get all possible scopes for a resource-action combination
 */
export function getPossibleScopes(
  resource: PermissionResource,
  action: PermissionAction
): PermissionScope[] {
  // Some combinations only make sense with certain scopes
  const scopeRestrictions: Record<string, PermissionScope[]> = {
    'auth:login': ['public'],
    'auth:logout': ['own'],
    'auth:refresh': ['own'],
    'auth:impersonate': ['all'],
    'user:create': ['all'],
    'user:delete': ['all'],
    'role:assign': ['all'],
    'role:revoke': ['all'],
    'system:backup': ['all'],
    'system:maintenance': ['all'],
    'webhook:ingest': ['public'],
    'audit:read': ['all'],
    'file:manage': ['all'],
    'notification:manage': ['all'],
    'workflow:approve': ['all'],
    'role:update': ['all'],
    'permission:manage': ['all']
  }

  const key = `${resource}:${action}`
  return scopeRestrictions[key] || VALID_SCOPES
}

/**
 * Validate permission components individually
 */
export function validatePermissionComponents(
  resource: string,
  action: string,
  scope: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isValidResource(resource)) {
    errors.push(`Invalid resource: ${resource}`)
  }

  if (!isValidAction(action)) {
    errors.push(`Invalid action: ${action}`)
  }

  if (!isValidScope(scope)) {
    errors.push(`Invalid scope: ${scope}`)
  }

  // Check if the combination makes sense
  if (isValidResource(resource) && isValidAction(action)) {
    const possibleScopes = getPossibleScopes(resource as PermissionResource, action as PermissionAction)
    if (!possibleScopes.includes(scope as PermissionScope)) {
      errors.push(`Scope '${scope}' is not valid for ${resource}:${action}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
=======
export type Scope = 'own' | 'provider' | 'organization' | 'booking' | 'public' | 'all'

export type Permission = {
  resource: string
  action: string
  scope: Scope
}

export function parsePermission(input: string): Permission {
  const parts = input.split(':')
  if (parts.length !== 3) throw new Error(`Invalid permission format: ${input}`)
  const [resource, action, scope] = parts
  const validScopes: Scope[] = ['own', 'provider', 'organization', 'booking', 'public', 'all']
  if (!validScopes.includes(scope as Scope)) throw new Error(`Invalid scope: ${scope}`)
  return { resource, action, scope: scope as Scope }
}

export function permissionKey(p: Permission): string {
  return `${p.resource}:${p.action}:${p.scope}`
}


>>>>>>> Stashed changes
