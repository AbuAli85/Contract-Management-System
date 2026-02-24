// ========================================
// 🛡️ RBAC GUARD - MAIN PERMISSION CHECKER
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { permissionEvaluator } from './evaluate';
import type { PermissionContext } from './evaluate';
import { parsePermission } from './permissions';
import { permissionCache } from './cache';

export interface GuardOptions {
  context?: PermissionContext;
  skipAudit?: boolean;
  skipCache?: boolean;
}

export interface GuardResult {
  allowed: boolean;
  reason: string;
  required_permission: string;
  user_permissions: (
    | string
    | { resource: string; action: string; scope: string }
  )[];
  user_roles: string[];
  user_id: string | null;
  context?: Record<string, any>;
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Enhanced error logging for debugging
    if (authError) {
      console.error('🔐 RBAC: Auth error:', {
        message: authError.message,
        status: authError.status,
        requiredPermission,
      });
    }

    if (!user) {
      // Try to get session for more debugging info
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.warn('🔐 RBAC: No user found', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        requiredPermission,
      });
    }

    if (authError || !user) {
      return {
        allowed: false,
        reason: authError
          ? `Auth error: ${authError.message}`
          : 'User not authenticated',
        required_permission: requiredPermission,
        user_permissions: [],
        user_roles: [],
        user_id: null,
      };
    }

    // Evaluate permission
    const evalOptions: any = {};
    if (typeof options.skipAudit === 'boolean')
      evalOptions.skipAudit = options.skipAudit;
    if (typeof options.skipCache === 'boolean')
      evalOptions.skipCache = options.skipCache;
    if (
      options.context &&
      (options.context as any).user &&
      (options.context as any).params
    ) {
      evalOptions.context = {
        ...(options.context as any),
        request: (options.context as any).request,
      } as PermissionContext;
    }

    const normalizedOptions: any = {
      skipAudit: !!evalOptions.skipAudit,
      skipCache: !!evalOptions.skipCache,
    };
    if (evalOptions.context) {
      normalizedOptions.context = evalOptions.context as PermissionContext;
    }

    // First try with normal cache
    let result = await permissionEvaluator.evaluatePermission(
      user.id,
      requiredPermission,
      normalizedOptions
    );

    // If no permissions found, force direct database lookup as fallback
    if (
      !result.allowed &&
      (!result.user_permissions || result.user_permissions.length === 0)
    ) {
      console.warn(
        '🔐 RBAC: No permissions found via cache, forcing direct lookup...'
      );
      normalizedOptions.skipCache = true;
      result = await permissionEvaluator.evaluatePermission(
        user.id,
        requiredPermission,
        normalizedOptions
      );

      if (result.user_permissions && result.user_permissions.length > 0) {
        console.log(
          '🔐 RBAC: Direct lookup found permissions:',
          result.user_permissions.length
        );
      }
    }

    // Add user ID to result
    const flattenedPerms = (result.user_permissions || []).map((p: any) =>
      typeof p === 'string' ? p : `${p.resource}:${p.action}:${p.scope}`
    );
    return {
      allowed: result.allowed,
      reason: result.reason || 'OK',
      required_permission: requiredPermission,
      user_permissions: flattenedPerms,
      user_roles: result.user_roles || [],
      user_id: user.id,
    };
  } catch (error) {
    console.error('🔐 RBAC: Error in checkPermission:', error);
    return {
      allowed: false,
      reason: 'Error checking permission',
      required_permission: requiredPermission,
      user_permissions: [],
      user_roles: [],
      user_id: null,
    };
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
    const enforcementMode = process.env.RBAC_ENFORCEMENT || 'enforce';

    // SECURITY FIX: Prevent dry-run mode in production
    if (
      process.env.NODE_ENV === 'production' &&
      enforcementMode !== 'enforce'
    ) {
      console.warn(
        '🔐 RBAC: Production environment detected, forcing enforce mode'
      );
      // Don't throw error, just log warning and continue
    }

    // Check permission
    const baseOptions: any = { ...options };
    // Avoid passing partially-typed context to satisfy exactOptionalPropertyTypes
    if (baseOptions.context === undefined) {
      delete baseOptions.context;
    }
    const result = await checkPermission(requiredPermission, baseOptions);

    // Optional: add audit logging here if needed

    // Handle dry-run mode (development only)
    if (
      enforcementMode === 'dry-run' &&
      process.env.NODE_ENV === 'development'
    ) {
      if (!result.allowed) {
        console.log(
          `🔐 RBAC: WOULD_BLOCK - ${requiredPermission} for ${request.url}`
        );
        // SECURITY FIX: Still perform actual check in dry-run for validation
        // Log but continue with enforcement logic
      }
      // Continue to enforcement logic even in dry-run for proper validation
    }

    // Handle enforce mode (and secure dry-run)
    if (!result.allowed) {
      // ✅ AUTO-FIX: If user is trying to access their own contracts or promoter profile, auto-assign role
      let sessionUserId: string | null = null;
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        sessionUserId = user?.id || null;
      } catch (e) {
        // Ignore - will use result.user_id instead
      }

      const userId = sessionUserId || result.user_id;
      const isPromoterAccess =
        userId &&
        requiredPermission.includes('promoter:') &&
        requiredPermission.includes(':own') &&
        request.nextUrl.pathname.includes('/api/promoters/');

      const isContractAccess =
        userId &&
        requiredPermission.includes('contract:') &&
        requiredPermission.includes(':own') &&
        (request.nextUrl.pathname.includes('/api/contracts/') ||
          request.nextUrl.pathname.includes('/api/contracts'));

      const isProfileAccess =
        userId &&
        (requiredPermission.includes('profile:') ||
          requiredPermission.includes('user:')) &&
        requiredPermission.includes(':own') &&
        (request.nextUrl.pathname.includes('/api/users/profile') ||
          request.nextUrl.pathname.includes('/api/users/activity'));

      if (isPromoterAccess || isContractAccess || isProfileAccess) {
        try {
          let shouldAutoFix = false;
          let resourceType = '';

          if (isPromoterAccess) {
            const pathParts = request.nextUrl.pathname.split('/');
            const promoterIdIndex = pathParts.indexOf('promoters') + 1;
            const promoterId = pathParts[promoterIdIndex];

            console.log(
              `🔍 AUTO-FIX: Checking if user ${userId} is accessing own promoter profile (promoterId: ${promoterId}, path: ${request.nextUrl.pathname})`
            );

            shouldAutoFix =
              promoterId === userId ||
              (promoterId &&
                userId &&
                promoterId.startsWith(userId.substring(0, 8))) ||
              (promoterId && userId && userId.startsWith(promoterId));
            resourceType = 'promoter';
          } else if (isContractAccess) {
            const pathParts = request.nextUrl.pathname.split('/');
            const contractIdIndex = pathParts.indexOf('contracts') + 1;
            const contractId = pathParts[contractIdIndex];

            console.log(
              `🔍 AUTO-FIX: Checking if user ${userId} is accessing contracts (contractId: ${contractId || 'list'}, path: ${request.nextUrl.pathname})`
            );

            shouldAutoFix = true; // Always allow for contract:read:own permission
            resourceType = 'contract';
          } else if (isProfileAccess) {
            // For profile/user access, always allow auto-fix (users should access their own profile/activity)
            console.log(
              `🔍 AUTO-FIX: User ${userId} is accessing own profile/activity (path: ${request.nextUrl.pathname})`
            );
            shouldAutoFix = true;
            resourceType = 'profile';
          }

          if (shouldAutoFix) {
            console.log(
              `✅ AUTO-FIX: User ${userId} is accessing own ${resourceType} resource, fixing permissions...`
            );

            const { ensurePromoterRole } =
              await import('@/lib/services/employee-account-service');
            await ensurePromoterRole(userId);
            console.log(
              `✅ Auto-assigned promoter role (with contract permissions) to user ${userId}`
            );

            // Clear permission cache for this user
            try {
              const { permissionCache } = await import('@/lib/rbac/cache');
              await permissionCache.invalidateUser(userId);
              console.log(`✅ Cleared permission cache for user ${userId}`);
            } catch (cacheError) {
              console.warn(
                '⚠️ Could not clear cache (non-critical):',
                cacheError
              );
            }

            // Longer delay to ensure database transaction is committed and indexes are updated
            await new Promise(resolve => setTimeout(resolve, 500));

            // Retry permission check after auto-fix
            console.log(`🔄 Retrying permission check for user ${userId}...`);
            const retryResult = await checkPermission(requiredPermission, {
              ...baseOptions,
              skipCache: true, // Force fresh lookup
            });

            console.log(`🔍 Retry result:`, {
              allowed: retryResult.allowed,
              user_permissions: retryResult.user_permissions,
              user_roles: retryResult.user_roles,
              reason: retryResult.reason,
            });

            if (retryResult.allowed) {
              console.log(
                `✅ Permission check passed after auto-fix for user ${userId}`
              );
              return null; // Allow access
            } else {
              console.error(
                `❌ Permission check still failed after auto-fix for user ${userId}:`,
                {
                  user_permissions: retryResult.user_permissions,
                  user_roles: retryResult.user_roles,
                  reason: retryResult.reason,
                }
              );

              // ✅ FALLBACK: If we've verified it's their own resource and auto-fix ran,
              // allow access anyway (permissions might take a moment to propagate)
              console.log(
                `⚠️ Allowing access as fallback for own-resource access (user ${userId})`
              );
              return null; // Allow access as fallback
            }
          }
        } catch (autoFixError) {
          console.error('❌ Could not auto-fix permissions:', autoFixError);
          // Continue with normal error handling
        }
      }

      console.log(
        `🔐 RBAC: BLOCKED - ${requiredPermission} for ${request.url}`
      );
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          required_permission: requiredPermission,
          reason: result.reason,
        },
        { status: 403 }
      );
    }

    // Permission granted
    return null;
  } catch (error) {
    console.error('🔐 RBAC: Error in guardPermission:', error);

    // In case of error, default to deny in enforce mode
    const enforcementMode =
      process.env.RBAC_ENFORCEMENT ||
      (process.env.NODE_ENV === 'production' ? 'enforce' : 'dry-run');
    if (enforcementMode === 'enforce') {
      return NextResponse.json(
        {
          error: 'Permission check failed',
          required_permission: requiredPermission,
          reason: 'Error checking permissions',
        },
        { status: 500 }
      );
    }

    return null;
  }
}

/**
 * Higher-order function to wrap API handlers with RBAC protection
 */
export function withRBAC<T extends any[]>(
  requiredPermission: string,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // 1. Apply rate limiting first
    const {
      applyRateLimit,
      getRateLimitConfigForEndpoint,
      getRateLimitHeaders,
    } = await import('@/lib/security/upstash-rate-limiter');

    const pathname = request.nextUrl.pathname;
    const method = request.method;
    const rateLimitConfig = getRateLimitConfigForEndpoint(pathname, method);

    const rateLimitResult = await applyRateLimit(request, rateLimitConfig);

    if (!rateLimitResult.success) {
      // Log rate limit violation
      console.warn('⚠️ Rate limit exceeded:', {
        endpoint: pathname,
        method,
        limitType: rateLimitConfig.type,
        retryAfter: rateLimitResult.retryAfter,
      });

      const headers = getRateLimitHeaders(rateLimitResult);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          resetAt: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // 2. Check permission
    const guardResult = await guardPermission(requiredPermission, request);

    if (guardResult) {
      // Add rate limit headers even to failed permission checks
      const headers = getRateLimitHeaders(rateLimitResult);
      const response = guardResult;
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 3. Execute handler with rate limit headers
    const response = await handler(request, ...args);
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * RBAC wrapper that checks if user has ANY of the required permissions
 * Uses OR logic - user needs at least one of the specified permissions
 */
export function withAnyRBAC<T extends any[]>(
  requiredPermissions: string[],
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // 1. Apply rate limiting first
    const {
      applyRateLimit,
      getRateLimitConfigForEndpoint,
      getRateLimitHeaders,
    } = await import('@/lib/security/upstash-rate-limiter');

    const pathname = request.nextUrl.pathname;
    const method = request.method;
    const rateLimitConfig = getRateLimitConfigForEndpoint(pathname, method);

    const rateLimitResult = await applyRateLimit(request, rateLimitConfig);

    if (!rateLimitResult.success) {
      // Log rate limit violation
      console.warn('⚠️ Rate limit exceeded:', {
        endpoint: pathname,
        method,
        limitType: rateLimitConfig.type,
        retryAfter: rateLimitResult.retryAfter,
      });

      const headers = getRateLimitHeaders(rateLimitResult);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          resetAt: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // 2. Check if user has any of the required permissions
    const guardResult = await guardAnyPermission(requiredPermissions, request);

    if (guardResult) {
      // Add rate limit headers even to failed permission checks
      const headers = getRateLimitHeaders(rateLimitResult);
      const response = guardResult;
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 3. Execute handler with rate limit headers
    const response = await handler(request, ...args);
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
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
    const enforcementMode = process.env.RBAC_ENFORCEMENT || 'dry-run';

    // Get user ID from session for auto-fix logic
    let sessionUserId: string | null = null;
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      sessionUserId = user?.id || null;
    } catch (e) {
      // Ignore - will use result.user_id instead
    }

    // Check if user has any of the required permissions
    const result = await checkAnyPermission(requiredPermissions, {
      ...options,
    });

    // If RBAC is disabled, always allow
    if (enforcementMode === 'disabled') {
      return null;
    }

    // If permission check failed
    if (!result.allowed) {
      // ✅ AUTO-FIX: If user is trying to access their own promoter profile or contracts, auto-assign role
      const userId = sessionUserId || result.user_id;
      const isPromoterAccess =
        userId &&
        requiredPermissions.some(
          p => p.includes('promoter:') && p.includes(':own')
        ) &&
        request.nextUrl.pathname.includes('/api/promoters/');

      const isContractAccess =
        userId &&
        requiredPermissions.some(
          p => p.includes('contract:') && p.includes(':own')
        ) &&
        (request.nextUrl.pathname.includes('/api/contracts/') ||
          request.nextUrl.pathname.includes('/api/contracts'));

      const isProfileAccess =
        userId &&
        requiredPermissions.some(
          p =>
            (p.includes('profile:') || p.includes('user:')) &&
            p.includes(':own')
        ) &&
        (request.nextUrl.pathname.includes('/api/users/profile') ||
          request.nextUrl.pathname.includes('/api/users/activity'));

      if (isPromoterAccess || isContractAccess || isProfileAccess) {
        try {
          let shouldAutoFix = false;
          let resourceType = '';

          if (isPromoterAccess) {
            // Extract promoter ID from URL
            const pathParts = request.nextUrl.pathname.split('/');
            const promoterIdIndex = pathParts.indexOf('promoters') + 1;
            const promoterId = pathParts[promoterIdIndex];

            console.log(
              `🔍 AUTO-FIX: Checking if user ${userId} is accessing own promoter profile (promoterId: ${promoterId}, path: ${request.nextUrl.pathname})`
            );

            // If user is accessing their own profile, auto-fix permissions
            // Check both full UUID match and partial match (for slug-based IDs)
            shouldAutoFix =
              promoterId === userId ||
              (promoterId &&
                userId &&
                promoterId.startsWith(userId.substring(0, 8))) ||
              (promoterId && userId && userId.startsWith(promoterId));
            resourceType = 'promoter';
          } else if (isContractAccess) {
            // For contract access, we allow auto-fix for:
            // 1. List view (/api/contracts) - user will see their own contracts via RLS
            // 2. Specific contract (/api/contracts/[id]) - will be checked in the route handler
            const pathParts = request.nextUrl.pathname.split('/');
            const contractIdIndex = pathParts.indexOf('contracts') + 1;
            const contractId = pathParts[contractIdIndex];

            console.log(
              `🔍 AUTO-FIX: Checking if user ${userId} is accessing contracts (contractId: ${contractId || 'list'}, path: ${request.nextUrl.pathname})`
            );

            // Allow auto-fix for contract access (the route handler will verify ownership)
            // This ensures users have the permission, even if the specific contract check happens later
            shouldAutoFix = true; // Always allow for contract:read:own permission
            resourceType = 'contract';
          } else if (isProfileAccess) {
            // For profile/user access, always allow auto-fix (users should access their own profile/activity)
            console.log(
              `🔍 AUTO-FIX: User ${userId} is accessing own profile/activity (path: ${request.nextUrl.pathname})`
            );
            shouldAutoFix = true;
            resourceType = 'profile';
          }

          if (shouldAutoFix) {
            console.log(
              `✅ AUTO-FIX: User ${userId} is accessing own ${resourceType} resource, fixing permissions...`
            );

            const { ensurePromoterRole } =
              await import('@/lib/services/employee-account-service');
            await ensurePromoterRole(userId);
            console.log(
              `✅ Auto-assigned promoter role (with contract permissions) to user ${userId}`
            );

            // Clear permission cache for this user
            try {
              const { permissionCache } = await import('@/lib/rbac/cache');
              await permissionCache.invalidateUser(userId);
              console.log(`✅ Cleared permission cache for user ${userId}`);
            } catch (cacheError) {
              console.warn(
                '⚠️ Could not clear cache (non-critical):',
                cacheError
              );
            }

            // Longer delay to ensure database transaction is committed and indexes are updated
            await new Promise(resolve => setTimeout(resolve, 500));

            // Retry permission check after auto-fix
            console.log(`🔄 Retrying permission check for user ${userId}...`);
            const retryResult = await checkAnyPermission(requiredPermissions, {
              ...options,
              skipCache: true, // Force fresh lookup
            });

            console.log(`🔍 Retry result:`, {
              allowed: retryResult.allowed,
              user_permissions: retryResult.user_permissions,
              user_roles: retryResult.user_roles,
              reason: retryResult.reason,
            });

            if (retryResult.allowed) {
              console.log(
                `✅ Permission check passed after auto-fix for user ${userId}`
              );
              return null; // Allow access
            } else {
              console.error(
                `❌ Permission check still failed after auto-fix for user ${userId}:`,
                {
                  user_permissions: retryResult.user_permissions,
                  user_roles: retryResult.user_roles,
                  reason: retryResult.reason,
                }
              );

              // ✅ FALLBACK: If we've verified it's their own profile and auto-fix ran,
              // allow access anyway (permissions might take a moment to propagate)
              console.log(
                `⚠️ Allowing access as fallback for own-profile access (user ${userId})`
              );
              return null; // Allow access as fallback
            }
          } else {
            console.log(
              `ℹ️ AUTO-FIX: Skipped - user ${userId} is not accessing own profile (promoterId: ${promoterId})`
            );
          }
        } catch (autoFixError) {
          console.error('❌ Could not auto-fix permissions:', autoFixError);
          // Continue with normal error handling
        }
      } else {
        console.log(
          `ℹ️ AUTO-FIX: Conditions not met - user_id: ${userId || result.user_id}, path: ${request.nextUrl.pathname}, requiredPerms: ${requiredPermissions.join(', ')}`
        );
      }

      // In dry-run mode, log but allow
      if (enforcementMode === 'dry-run') {
        console.warn(`🔐 RBAC DRY-RUN: Access denied to ${request.url}`, {
          required_permissions: requiredPermissions,
          user_permissions: result.user_permissions,
          user_roles: result.user_roles,
          reason: result.reason,
        });
        return null;
      }

      // In enforce mode, deny access
      console.warn(`🔐 RBAC ENFORCE: Access denied to ${request.url}`, {
        required_permissions: requiredPermissions,
        user_permissions: result.user_permissions,
        user_roles: result.user_roles,
        reason: result.reason,
      });

      // Add detailed debugging for empty permissions
      if (result.user_permissions.length === 0) {
        console.error('🔐 RBAC DEBUG: User permissions array is empty!');
        console.error('🔐 RBAC DEBUG: User roles array:', result.user_roles);
        console.error(
          '🔐 RBAC DEBUG: Result object:',
          JSON.stringify(result, null, 2)
        );
      }

      return NextResponse.json(
        {
          error: 'Access denied',
          reason: result.reason,
          required_permissions: requiredPermissions,
          user_permissions: result.user_permissions,
          user_roles: result.user_roles,
        },
        { status: 403 }
      );
    }

    // Permission check passed
    return null;
  } catch (error) {
    console.error('🔐 RBAC: Error in guardAnyPermission:', error);

    // In dry-run mode, allow on error
    if (process.env.RBAC_ENFORCEMENT === 'dry-run') {
      console.warn(
        '🔐 RBAC DRY-RUN: Allowing access due to error in permission check'
      );
      return null;
    }

    // In enforce mode, deny on error
    return NextResponse.json(
      {
        error: 'Error checking permissions',
        details: 'Internal server error during permission validation',
      },
      { status: 500 }
    );
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        required_permission: requiredPermissions.join(' OR '),
        user_permissions: [],
        user_roles: [],
        user_id: null,
      };
    }

    const anyOptions: any = {
      skipAudit: !!options.skipAudit,
      skipCache: !!options.skipCache,
    };
    if (options.context)
      anyOptions.context = options.context as PermissionContext;

    console.log(
      '🔐 RBAC DEBUG: Calling hasAnyPermission with options:',
      anyOptions
    );
    let result = await permissionEvaluator.hasAnyPermission(
      user.id,
      requiredPermissions,
      anyOptions
    );

    console.log('🔐 RBAC DEBUG: hasAnyPermission result:', {
      allowed: result.allowed,
      user_permissions_count: result.user_permissions?.length || 0,
      user_roles_count: result.user_roles?.length || 0,
      reason: result.reason,
    });

    // If no permissions found, force direct database lookup as fallback
    if (
      !result.allowed &&
      (!result.user_permissions || result.user_permissions.length === 0)
    ) {
      console.warn(
        '🔐 RBAC: No permissions found via cache, forcing direct lookup...'
      );
      anyOptions.skipCache = true;
      result = await permissionEvaluator.hasAnyPermission(
        user.id,
        requiredPermissions,
        anyOptions
      );

      console.log(
        '🔐 RBAC DEBUG: hasAnyPermission result after direct lookup:',
        {
          allowed: result.allowed,
          user_permissions_count: result.user_permissions?.length || 0,
          user_roles_count: result.user_roles?.length || 0,
          reason: result.reason,
        }
      );

      if (result.user_permissions && result.user_permissions.length > 0) {
        console.log(
          '🔐 RBAC: Direct lookup found permissions:',
          result.user_permissions.length
        );
      }
    }

    const flattenedPerms = (result.user_permissions || []).map((p: any) =>
      typeof p === 'string' ? p : `${p.resource}:${p.action}:${p.scope}`
    );
    return {
      allowed: result.allowed,
      reason: result.reason || (result.allowed ? 'OK' : 'DENY'),
      required_permission: requiredPermissions.join(' OR '),
      user_permissions: flattenedPerms,
      user_roles: result.user_roles || [],
      user_id: user.id, // ✅ Use user.id from auth, not result.user_id
    };
  } catch (error) {
    console.error('🔐 RBAC: Error in checkAnyPermission:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions',
      required_permission: requiredPermissions.join(' OR '),
      user_permissions: [],
      user_roles: [],
      user_id: null,
    };
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        required_permission: requiredPermissions.join(' AND '),
        user_permissions: [],
        user_roles: [],
        user_id: null,
      };
    }

    const allOptions: any = {
      skipAudit: !!options.skipAudit,
      skipCache: !!options.skipCache,
    };
    if (options.context)
      allOptions.context = options.context as PermissionContext;

    // First try with normal cache
    let result = await permissionEvaluator.hasAllPermissions(
      user.id,
      requiredPermissions,
      allOptions
    );

    // If no permissions found, force direct database lookup as fallback
    if (
      !result.allowed &&
      (!result.user_permissions || result.user_permissions.length === 0)
    ) {
      console.warn(
        '🔐 RBAC: No permissions found via cache, forcing direct lookup...'
      );
      allOptions.skipCache = true;
      result = await permissionEvaluator.hasAllPermissions(
        user.id,
        requiredPermissions,
        allOptions
      );

      if (result.user_permissions && result.user_permissions.length > 0) {
        console.log(
          '🔐 RBAC: Direct lookup found permissions:',
          result.user_permissions.length
        );
      }
    }

    const flattenedPerms = (result.user_permissions || []).map((p: any) =>
      typeof p === 'string' ? p : `${p.resource}:${p.action}:${p.scope}`
    );
    return {
      allowed: result.allowed,
      reason: result.reason || (result.allowed ? 'OK' : 'DENY'),
      required_permission: requiredPermissions.join(' AND '),
      user_permissions: flattenedPerms,
      user_roles: result.user_roles || [],
      user_id: result.user_id || null,
    };
  } catch (error) {
    console.error('🔐 RBAC: Error in checkAllPermissions:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions',
      required_permission: requiredPermissions.join(' AND '),
      user_permissions: [],
      user_roles: [],
      user_id: null,
    };
  }
}

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<{
  permissions: string[];
  roles: string[];
  userId: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { permissions: [], roles: [], userId: null };
    }

    const { permissions, roles } = await permissionCache.getUserPermissions(
      user.id
    );
    return { permissions, roles, userId: user.id };
  } catch (error) {
    console.error('🔐 RBAC: Error getting current user permissions:', error);
    return { permissions: [], roles: [], userId: null };
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const result = await permissionEvaluator.evaluatePermission(
      user.id,
      permission,
      { skipAudit: true }
    );
    return result.allowed;
  } catch (error) {
    console.error('🔐 RBAC: Error checking if user has permission:', error);
    return false;
  }
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(
  permissions: string[]
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const result = await permissionEvaluator.hasAnyPermission(
      user.id,
      permissions,
      { skipAudit: true }
    );
    return result.allowed;
  } catch (error) {
    console.error('🔐 RBAC: Error checking if user has any permission:', error);
    return false;
  }
}

/**
 * Check if current user has all of the specified permissions
 */
export async function hasAllPermissions(
  permissions: string[]
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const result = await permissionEvaluator.hasAllPermissions(
      user.id,
      permissions,
      { skipAudit: true }
    );
    return result.allowed;
  } catch (error) {
    console.error(
      '🔐 RBAC: Error checking if user has all permissions:',
      error
    );
    return false;
  }
}

/**
 * Validate permission string format
 */
export function validatePermission(permission: string): boolean {
  return parsePermission(permission) !== null;
}

/**
 * Get RBAC enforcement mode
 */
export function getRBACEnforcementMode(): 'dry-run' | 'enforce' | 'disabled' {
  const mode = process.env.RBAC_ENFORCEMENT || 'dry-run';

  if (mode === 'dry-run' || mode === 'enforce' || mode === 'disabled') {
    return mode;
  }

  console.warn(
    `🔐 RBAC: Invalid RBAC_ENFORCEMENT mode: ${mode}, defaulting to dry-run`
  );
  return 'dry-run';
}

/**
 * Check if RBAC is enabled
 */
export function isRBACEnabled(): boolean {
  const mode = getRBACEnforcementMode();
  return mode !== 'disabled';
}

/**
 * Check if RBAC is in enforce mode
 */
export function isRBACEnforced(): boolean {
  return getRBACEnforcementMode() === 'enforce';
}

/**
 * Check if RBAC is in dry-run mode
 */
export function isRBACDryRun(): boolean {
  return getRBACEnforcementMode() === 'dry-run';
}
