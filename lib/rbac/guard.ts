<<<<<<< Updated upstream
// ========================================
// 🛡️ RBAC GUARD - MAIN PERMISSION CHECKER
// ========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { permissionEvaluator, PermissionContext } from './evaluate'
import { auditLogger, AuditLogger } from './audit'
import { parsePermission } from './permissions'

export interface GuardOptions {
  context?: PermissionContext
  skipAudit?: boolean
  skipCache?: boolean
}

export interface GuardResult {
  allowed: boolean
  reason: string
  required_permission: string
  user_permissions: string[]
  user_roles: string[]
  user_id?: string
  context?: Record<string, any>
}

/**
 * Main RBAC guard function
 * Checks if user has required permission and respects RBAC_ENFORCEMENT setting
 */
export async function checkPermission(
  requiredPermission: string,
  options: GuardOptions = {}
): Promise<GuardResult> {
  try {
    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        required_permission: requiredPermission,
        user_permissions: [],
        user_roles: [],
        user_id: null
      }
    }

    // Evaluate permission
    const result = await permissionEvaluator.evaluatePermission(
      user.id,
      requiredPermission,
      {
        skipAudit: options.skipAudit,
        skipCache: options.skipCache,
        context: options.context
      }
    )

    // Add user ID to result
    return {
      ...result,
      user_id: user.id
    }
  } catch (error) {
    console.error('🔐 RBAC: Error in checkPermission:', error)
    return {
      allowed: false,
      reason: 'Error checking permission',
      required_permission: requiredPermission,
      user_permissions: [],
      user_roles: [],
      user_id: null
    }
  }
}

/**
 * Guard function that returns NextResponse for API routes
 * Respects RBAC_ENFORCEMENT setting
 */
export async function guardPermission(
  requiredPermission: string,
  request: NextRequest,
  options: GuardOptions = {}
): Promise<NextResponse | null> {
  try {
    // Get RBAC enforcement mode
    const enforcementMode = process.env.RBAC_ENFORCEMENT || 'dry-run'
    
    // Check permission
    const result = await checkPermission(requiredPermission, {
      ...options,
      context: {
        ...options.context,
        request
      }
    })

    // Log the permission check
    if (!options.skipAudit) {
      await auditLogger.logPermissionUsage({
        user_id: result.user_id || 'anonymous',
        permission: requiredPermission,
        path: request.url,
        result: result.allowed ? 'ALLOW' : 'DENY',
        ip_address: AuditLogger.getClientIP(request),
        user_agent: AuditLogger.getUserAgent(request)
      })
    }

    // Handle dry-run mode
    if (enforcementMode === 'dry-run') {
      if (!result.allowed) {
        console.log(`🔐 RBAC: WOULD_BLOCK - ${requiredPermission} for ${request.url}`)
        // In dry-run mode, allow the request but log that it would be blocked
        return null
      }
      return null
    }

    // Handle enforce mode
    if (enforcementMode === 'enforce') {
      if (!result.allowed) {
        console.log(`🔐 RBAC: BLOCKED - ${requiredPermission} for ${request.url}`)
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            required_permission: requiredPermission,
            reason: result.reason
          },
          { status: 403 }
        )
      }
      return null
    }

    // Default: allow if no enforcement mode specified
    return null
  } catch (error) {
    console.error('🔐 RBAC: Error in guardPermission:', error)
    
    // In case of error, default to deny in enforce mode
    const enforcementMode = process.env.RBAC_ENFORCEMENT || 'dry-run'
    if (enforcementMode === 'enforce') {
      return NextResponse.json(
        {
          error: 'Permission check failed',
          required_permission: requiredPermission,
          reason: 'Error checking permissions'
        },
        { status: 500 }
      )
    }
    
    return null
  }
}

/**
 * Higher-order function to wrap API handlers with RBAC protection
 */
export function withRBAC<T extends any[]>(
  requiredPermission: string,
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Check permission first
    const guardResult = await guardPermission(requiredPermission, request)
    
    if (guardResult) {
      return guardResult
    }

    // Permission check passed, execute handler
    return handler(request, ...args)
  }
}

/**
 * RBAC wrapper that checks if user has ANY of the required permissions
 * Uses OR logic - user needs at least one of the specified permissions
 */
export function withAnyRBAC<T extends any[]>(
  requiredPermissions: string[],
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Check if user has any of the required permissions
    const guardResult = await guardAnyPermission(requiredPermissions, request)
    
    if (guardResult) {
      return guardResult
    }

    // Permission check passed, execute handler
    return handler(request, ...args)
  }
}

/**
 * Guard function that returns NextResponse for API routes when checking multiple permissions
 * Respects RBAC_ENFORCEMENT setting
 */
async function guardAnyPermission(
  requiredPermissions: string[],
  request: NextRequest,
  options: GuardOptions = {}
): Promise<NextResponse | null> {
  try {
    // Get RBAC enforcement mode
    const enforcementMode = process.env.RBAC_ENFORCEMENT || 'dry-run'
    
    // Check if user has any of the required permissions
    const result = await checkAnyPermission(requiredPermissions, {
      ...options,
      context: {
        ...options.context,
        request
      }
    })

    // If RBAC is disabled, always allow
    if (enforcementMode === 'disabled') {
      return null
    }

    // If permission check failed
    if (!result.allowed) {
      // In dry-run mode, log but allow
      if (enforcementMode === 'dry-run') {
        console.warn(`🔐 RBAC DRY-RUN: Access denied to ${request.url}`, {
          required_permissions: requiredPermissions,
          user_permissions: result.user_permissions,
          user_roles: result.user_roles,
          reason: result.reason
        })
        return null
      }

      // In enforce mode, deny access
      console.warn(`🔐 RBAC ENFORCE: Access denied to ${request.url}`, {
        required_permissions: requiredPermissions,
        user_permissions: result.user_permissions,
        user_roles: result.user_roles,
        reason: result.reason
      })

      return NextResponse.json(
        {
          error: 'Access denied',
          reason: result.reason,
          required_permissions: requiredPermissions,
          user_permissions: result.user_permissions,
          user_roles: result.user_roles
        },
        { status: 403 }
      )
    }

    // Permission check passed
    return null
  } catch (error) {
    console.error('🔐 RBAC: Error in guardAnyPermission:', error)
    
    // In dry-run mode, allow on error
    if (process.env.RBAC_ENFORCEMENT === 'dry-run') {
      console.warn('🔐 RBAC DRY-RUN: Allowing access due to error in permission check')
      return null
    }

    // In enforce mode, deny on error
    return NextResponse.json(
      {
        error: 'Error checking permissions',
        details: 'Internal server error during permission validation'
      },
      { status: 500 }
    )
  }
}

/**
 * Check if user has any of the required permissions
 */
export async function checkAnyPermission(
  requiredPermissions: string[],
  options: GuardOptions = {}
): Promise<GuardResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        required_permission: requiredPermissions.join(' OR '),
        user_permissions: [],
        user_roles: []
      }
    }

    const result = await permissionEvaluator.hasAnyPermission(
      user.id,
      requiredPermissions,
      {
        skipAudit: options.skipAudit,
        skipCache: options.skipCache,
        context: options.context
      }
    )

    return result
  } catch (error) {
    console.error('🔐 RBAC: Error in checkAnyPermission:', error)
    return {
      allowed: false,
      reason: 'Error checking permissions',
      required_permission: requiredPermissions.join(' OR '),
      user_permissions: [],
      user_roles: []
    }
  }
}

/**
 * Check if user has all required permissions
 */
export async function checkAllPermissions(
  requiredPermissions: string[],
  options: GuardOptions = {}
): Promise<GuardResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        required_permission: requiredPermissions.join(' AND '),
        user_permissions: [],
        user_roles: []
      }
    }

    const result = await permissionEvaluator.hasAllPermissions(
      user.id,
      requiredPermissions,
      {
        skipAudit: options.skipAudit,
        skipCache: options.skipCache,
        context: options.context
      }
    )

    return result
  } catch (error) {
    console.error('🔐 RBAC: Error in checkAllPermissions:', error)
    return {
      allowed: false,
      reason: 'Error checking permissions',
      required_permission: requiredPermissions.join(' AND '),
      user_permissions: [],
      user_roles: []
    }
  }
}

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<{
  permissions: string[]
  roles: string[]
  userId: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { permissions: [], roles: [], userId: null }
    }

    const { permissions, roles } = await permissionEvaluator['permissionCache'].getUserPermissions(user.id)
    return { permissions, roles, userId: user.id }
  } catch (error) {
    console.error('🔐 RBAC: Error getting current user permissions:', error)
    return { permissions: [], roles: [], userId: null }
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const result = await permissionEvaluator.evaluatePermission(user.id, permission, { skipAudit: true })
    return result.allowed
  } catch (error) {
    console.error('🔐 RBAC: Error checking if user has permission:', error)
    return false
  }
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const result = await permissionEvaluator.hasAnyPermission(user.id, permissions, { skipAudit: true })
    return result.allowed
  } catch (error) {
    console.error('🔐 RBAC: Error checking if user has any permission:', error)
    return false
  }
}

/**
 * Check if current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const result = await permissionEvaluator.hasAllPermissions(user.id, permissions, { skipAudit: true })
    return result.allowed
  } catch (error) {
    console.error('🔐 RBAC: Error checking if user has all permissions:', error)
    return false
  }
}

/**
 * Validate permission string format
 */
export function validatePermission(permission: string): boolean {
  return parsePermission(permission) !== null
}

/**
 * Get RBAC enforcement mode
 */
export function getRBACEnforcementMode(): 'dry-run' | 'enforce' | 'disabled' {
  const mode = process.env.RBAC_ENFORCEMENT || 'dry-run'
  
  if (mode === 'dry-run' || mode === 'enforce' || mode === 'disabled') {
    return mode
  }
  
  console.warn(`🔐 RBAC: Invalid RBAC_ENFORCEMENT mode: ${mode}, defaulting to dry-run`)
  return 'dry-run'
}

/**
 * Check if RBAC is enabled
 */
export function isRBACEnabled(): boolean {
  const mode = getRBACEnforcementMode()
  return mode !== 'disabled'
}

/**
 * Check if RBAC is in enforce mode
 */
export function isRBACEnforced(): boolean {
  return getRBACEnforcementMode() === 'enforce'
}

/**
 * Check if RBAC is in dry-run mode
 */
export function isRBACDryRun(): boolean {
  return getRBACEnforcementMode() === 'dry-run'
}
=======
import { NextRequest, NextResponse } from 'next/server'
import { parsePermission, Permission } from './permissions'
import { PermissionCache } from './cache'
import { checkOwnership } from './context/ownership'
import { checkProviderAccess } from './context/provider'
import { checkOrganizationAccess } from './context/organization'
import { checkBookingAccess } from './context/booking'
import { AuditLogger } from './audit'

async function evaluatePermission(userPerms: Permission[], required: Permission, ctx: any): Promise<boolean> {
  const base = userPerms.some(p => p.resource === required.resource && p.action === required.action && (p.scope === required.scope || p.scope === 'all'))
  if (!base) return false
  switch (required.scope) {
    case 'all':
    case 'public':
      return true
    case 'own':
      return checkOwnership(required.resource, ctx)
    case 'provider':
      return checkProviderAccess(required.resource, ctx)
    case 'organization':
      return checkOrganizationAccess(required.resource, ctx)
    case 'booking':
      return checkBookingAccess(required.resource, ctx)
    default:
      return false
  }
}

export const withRBAC = (requiredPermission: string, handler: (req: NextRequest, ctx: any) => Promise<NextResponse>) => {
  return async (req: NextRequest, routeCtx: any) => {
    const mode = process.env.RBAC_ENFORCEMENT || 'dry-run'
    try {
      // user is expected to be resolved in existing auth flows inside handler; we best-effort probe header
      const userHeader = req.headers.get('x-user-id')
      const userId = userHeader || ''
      const required = parsePermission(requiredPermission)
      const perms = userId ? await PermissionCache.getUserPermissions(userId) : []
      const allowed = await evaluatePermission(perms, required, { user: { id: userId }, params: (routeCtx as any)?.params, body: null, query: Object.fromEntries(new URL(req.url).searchParams), now: new Date() })
      const result: 'ALLOW'|'DENY'|'WOULD_BLOCK' = allowed ? 'ALLOW' : (mode === 'dry-run' ? 'WOULD_BLOCK' : 'DENY')
      await AuditLogger.logPermissionUsage(userId, requiredPermission, new URL(req.url).pathname, result, (req as any).ip, req.headers.get('user-agent') || undefined)
      if (!allowed && mode === 'enforce') {
        return NextResponse.json({ success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', required_permission: requiredPermission } }, { status: 403 })
      }
      return handler(req, routeCtx)
    } catch (err) {
      return NextResponse.json({ success: false, error: { code: 'PERMISSION_CHECK_FAILED' } }, { status: 500 })
    }
  }
}


>>>>>>> Stashed changes
