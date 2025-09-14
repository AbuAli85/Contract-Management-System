// ========================================
// 🛡️ RBAC PERMISSION EVALUATION
// ========================================

import { parsePermission } from './permissions';
import { ownershipEvaluator, OwnershipContext } from './context/ownership';
import { permissionCache } from './cache';
import { auditLogger } from './audit';
import { NextRequest } from 'next/server';

export type PermissionDecision = {
  allowed: boolean;
  reason?: string; // e.g., 'NO_BASE_PERMISSION' | 'SCOPE_CHECK_FAILED'
  permission: string; // original requested key e.g., 'user:read:own'
  resource: string;
  action: string;
  scope: 'own' | 'provider' | 'organization' | 'booking' | 'public' | 'all';
  user_id?: string;
  user_roles?: string[];
  user_permissions?: { resource: string; action: string; scope: string }[];
};

export interface PermissionContext {
  user: {
    id: string;
    email?: string;
    provider_id?: string;
    organization_id?: string;
  };
  params: Record<string, any>;
  resourceType?: string;
  resourceId?: string;
  request?: NextRequest;
}

export interface EvaluationOptions {
  skipAudit?: boolean;
  skipCache?: boolean;
  context?: PermissionContext;
}

export class PermissionEvaluator {
  /**
   * Evaluate if user has required permission
   */
  async evaluatePermission(
    userId: string,
    requiredPermission: string,
    options: EvaluationOptions = {}
  ): Promise<PermissionDecision> {
    try {
      // Parse the required permission
      const parsed = parsePermission(requiredPermission);
      if (!parsed) {
        return {
          allowed: false,
          reason: `Invalid permission format: ${requiredPermission}`,
          permission: requiredPermission,
          resource: 'unknown',
          action: 'unknown',
          scope: 'public',
          user_id: userId,
          user_roles: [],
          user_permissions: [],
        };
      }

      // Get user permissions from cache
      const { permissions: userPermissions, roles: userRoles } =
        options.skipCache
          ? await this.fetchUserPermissionsDirectly(userId)
          : await permissionCache.getUserPermissions(userId);

      // Convert string permissions to structured format for evaluation
      const structuredPermissions = userPermissions
        .map(perm => {
          const parsed = parsePermission(perm);
          return parsed
            ? {
                resource: parsed.resource,
                action: parsed.action,
                scope: parsed.scope,
              }
            : null;
        })
        .filter(Boolean) as {
        resource: string;
        action: string;
        scope: string;
      }[];

      // Check base permission
      const baseCheck = await this.checkBasePermission(
        structuredPermissions,
        requiredPermission,
        parsed,
        options.context
      );

      // Audit the permission check
      if (!options.skipAudit) {
        await this.auditPermissionCheck(
          userId,
          requiredPermission,
          baseCheck.allowed ? 'ALLOW' : 'DENY',
          options.context?.request
        );
      }

      return {
        ...baseCheck,
        user_id: userId,
        user_roles: userRoles,
        user_permissions: structuredPermissions,
      };
    } catch (error) {
      console.error('🔐 RBAC: Error evaluating permission:', error);

      const result: PermissionDecision = {
        allowed: false,
        reason: 'Error evaluating permission',
        permission: requiredPermission,
        resource: 'unknown',
        action: 'unknown',
        scope: 'public',
        user_id: userId,
        user_roles: [],
        user_permissions: [],
      };

      // Audit the error
      if (!options.skipAudit) {
        await this.auditPermissionCheck(
          userId,
          requiredPermission,
          'DENY',
          options.context?.request
        );
      }

      return result;
    }
  }

  /**
   * Check base permission and scope
   */
  private async checkBasePermission(
    userPerms: { resource: string; action: string; scope: string }[],
    requiredPermission: string,
    parsed: { resource: string; action: string; scope: string },
    context?: PermissionContext
  ): Promise<
    Omit<PermissionDecision, 'user_id' | 'user_roles' | 'user_permissions'>
  > {
    const { resource, action, scope } = parsed;

    // Check if user has the exact permission
    const exactMatch = userPerms.some(
      p => p.resource === resource && p.action === action && p.scope === scope
    );

    if (exactMatch) {
      return {
        allowed: true,
        reason: 'Exact permission match',
        permission: requiredPermission,
        resource,
        action,
        scope,
      };
    }

    // Check if user has a broader scope permission
    const broaderPermission = userPerms.find(
      p =>
        p.resource === resource &&
        p.action === action &&
        this.isScopeSufficient(p.scope, scope)
    );

    if (broaderPermission) {
      return {
        allowed: true,
        reason: `Broader scope permission: ${broaderPermission.scope}`,
        permission: requiredPermission,
        resource,
        action,
        scope,
      };
    }

    // Check context-based permissions if context is provided
    if (context) {
      const contextResult = await this.evaluateContextBasedPermission(
        userPerms,
        parsed,
        context
      );

      if (contextResult.allowed) {
        return {
          allowed: true,
          reason: contextResult.reason || 'Context-based permission granted',
          permission: requiredPermission,
          resource,
          action,
          scope,
        };
      }
    }

    // Permission denied
    return {
      allowed: false,
      reason: 'NO_BASE_PERMISSION',
      permission: requiredPermission,
      resource,
      action,
      scope,
    };
  }

  /**
   * Check if a scope is sufficient for a required scope
   */
  private isScopeSufficient(userScope: string, requiredScope: string): boolean {
    const scopeHierarchy: Record<string, number> = {
      public: 1,
      own: 2,
      booking: 3,
      organization: 4,
      provider: 5,
      all: 6,
    };

    return (
      (scopeHierarchy[userScope] || 0) >= (scopeHierarchy[requiredScope] || 0)
    );
  }

  /**
   * Evaluate context-based permissions
   */
  private async evaluateContextBasedPermission(
    userPerms: { resource: string; action: string; scope: string }[],
    parsed: { resource: string; action: string; scope: string },
    context: PermissionContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    const { resourceType, resourceId, user } = context;

    // Check ownership-based permissions
    if (parsed.scope === 'own' && resourceId && resourceType) {
      const ownershipContext: OwnershipContext = {
        user,
        params: context.params,
        resourceType,
        resourceId,
      };

      const ownershipResult = await ownershipEvaluator.checkOwnership(
        resourceType,
        ownershipContext
      );

      if (ownershipResult.isOwner) {
        return {
          allowed: true,
          reason: `User owns this ${resourceType}`,
        };
      }
    }

    // Check organization-based permissions
    if (parsed.scope === 'organization' && resourceId && user.organization_id) {
      const ownershipResult =
        await ownershipEvaluator.checkOrganizationOwnership(
          resourceType || 'unknown',
          {
            user,
            params: context.params,
            resourceType: resourceType || 'unknown',
            resourceId,
          }
        );

      if (ownershipResult.isOwner) {
        return {
          allowed: true,
          reason: 'User in same organization',
        };
      }
    }

    // Check provider-based permissions
    if (parsed.scope === 'provider' && resourceId && user.provider_id) {
      const ownershipResult = await ownershipEvaluator.checkProviderOwnership(
        resourceType || 'unknown',
        {
          user,
          params: context.params,
          resourceType: resourceType || 'unknown',
          resourceId,
        }
      );

      if (ownershipResult.isOwner) {
        return {
          allowed: true,
          reason: 'User in same provider organization',
        };
      }
    }

    // Check booking-based permissions
    if (parsed.scope === 'booking' && resourceId) {
      const ownershipResult = await ownershipEvaluator.checkOwnership(
        'booking',
        {
          user,
          params: context.params,
          resourceType: 'booking',
          resourceId,
        }
      );

      if (ownershipResult.isOwner) {
        return {
          allowed: true,
          reason: 'User has access to this booking',
        };
      }
    }

    return { allowed: false, reason: 'Context-based permission check failed' };
  }

  /**
   * Check if user has any of the required permissions
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: string[],
    options: EvaluationOptions = {}
  ): Promise<PermissionDecision> {
    for (const permission of requiredPermissions) {
      const result = await this.evaluatePermission(userId, permission, {
        ...options,
        skipAudit: true,
      });
      if (result.allowed) {
        // Audit the successful check
        if (!options.skipAudit) {
          await this.auditPermissionCheck(
            userId,
            permission,
            'ALLOW',
            options.context?.request
          );
        }
        return result;
      }
    }

    const result: PermissionDecision = {
      allowed: false,
      reason: 'User does not have any of the required permissions',
      permission: requiredPermissions.join(' OR '),
      resource: 'multiple',
      action: 'multiple',
      scope: 'public',
      user_id: userId,
      user_roles: [],
      user_permissions: [],
    };

    // Audit the failed check
    if (!options.skipAudit) {
      await this.auditPermissionCheck(
        userId,
        requiredPermissions.join(' OR '),
        'DENY',
        options.context?.request
      );
    }

    return result;
  }

  /**
   * Check if user has all required permissions
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: string[],
    options: EvaluationOptions = {}
  ): Promise<PermissionDecision> {
    const results = await Promise.all(
      requiredPermissions.map(permission =>
        this.evaluatePermission(userId, permission, {
          ...options,
          skipAudit: true,
        })
      )
    );

    const deniedPermissions = results.filter(result => !result.allowed);

    if (deniedPermissions.length === 0) {
      const result: PermissionDecision = {
        allowed: true,
        reason: 'User has all required permissions',
        permission: requiredPermissions.join(' AND '),
        resource: 'multiple',
        action: 'multiple',
        scope: 'public',
        user_id: userId,
        user_roles: results[0]?.user_roles || [],
        user_permissions: results[0]?.user_permissions || [],
      };

      // Audit the permission check
      if (!options.skipAudit) {
        await this.auditPermissionCheck(
          userId,
          requiredPermissions.join(' AND '),
          'ALLOW',
          options.context?.request
        );
      }

      return result;
    }

    const result: PermissionDecision = {
      allowed: false,
      reason: `User missing permissions: ${deniedPermissions.map(r => r.permission).join(', ')}`,
      permission: requiredPermissions.join(' AND '),
      resource: 'multiple',
      action: 'multiple',
      scope: 'public',
      user_id: userId,
      user_roles: results[0]?.user_roles || [],
      user_permissions: results[0]?.user_permissions || [],
    };

    // Audit the permission check
    if (!options.skipAudit) {
      await this.auditPermissionCheck(
        userId,
        requiredPermissions.join(' AND '),
        'DENY',
        options.context?.request
      );
    }

    return result;
  }

  /**
   * Fetch user permissions directly from database (bypass cache)
   */
  private async fetchUserPermissionsDirectly(
    userId: string
  ): Promise<{ permissions: string[]; roles: string[] }> {
    try {
      // Use service-role Supabase client to bypass RLS for RBAC lookups
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
      const supabase = getSupabaseAdmin();

      // Try new RBAC tables first
      let roleAssignments: any[] | null = null;
      let rolesFetchError: any = null;
      
      try {
        const r = await supabase
          .from('rbac_user_role_assignments')
          .select(
            `
            role_id,
            rbac_roles!inner(
              name,
              category
            )
          `
          )
          .eq('user_id', userId)
          .eq('is_active', true)
          .is('valid_until', null);
        roleAssignments = r.data as any[] | null;
        rolesFetchError = r.error;
      } catch (e) {
        rolesFetchError = e;
      }

      // Legacy fallback
      if ((!roleAssignments || roleAssignments.length === 0) && rolesFetchError) {
        const { data, error } = await supabase
          .from('user_role_assignments')
          .select(
            `
            role_id,
            roles!inner(
              name,
              category
            )
          `
          )
          .eq('user_id', userId)
          .eq('is_active', true)
          .is('valid_until', null);
        roleAssignments = data as any[] | null;
        rolesFetchError = error;
      }

      if (rolesFetchError) {
        console.error('🔐 RBAC: Failed to fetch user roles:', rolesFetchError);
        return { permissions: [], roles: [] };
      }

      if (!roleAssignments || roleAssignments.length === 0) {
        return { permissions: [], roles: [] };
      }

      const roleIds = roleAssignments.map(ra => ra.role_id);
      const roles = roleAssignments.map(ra =>
        // Handle both rbac_roles and legacy roles linkage
        (ra.rbac_roles?.name as string) || (ra.roles?.name as string)
      );

      // Get permissions for these roles (new RBAC first)
      let permissionsRows: any[] | null = null;
      let permError: any = null;
      
      try {
        const pr = await supabase
          .from('rbac_role_permissions')
          .select(
            `
            rbac_permissions!inner(
              name
            )
          `
          )
          .in('role_id', roleIds);
        permissionsRows = pr.data as any[] | null;
        permError = pr.error;
      } catch (e) {
        permError = e;
      }

      // Legacy fallback
      if ((!permissionsRows || permissionsRows.length === 0) && permError) {
        const { data, error } = await supabase
          .from('role_permissions')
          .select(
            `
            permissions!inner(
              name
            )
          `
          )
          .in('role_id', roleIds);
        permissionsRows = data as any[] | null;
        permError = error;
      }

      if (permError) {
        console.error('🔐 RBAC: Failed to fetch permissions:', permError);
        return { permissions: [], roles: [] };
      }

      const permissionNames = (permissionsRows || []).map(row =>
        row.rbac_permissions?.name || row.permissions?.name
      ).filter(Boolean) as string[];

      return {
        permissions: permissionNames,
        roles,
      };
    } catch (error) {
      console.error(
        '🔐 RBAC: Error fetching user permissions directly:',
        error
      );
      return { permissions: [], roles: [] };
    }
  }

  /**
   * Audit permission check
   */
  private async auditPermissionCheck(
    userId: string,
    permission: string,
    result: 'ALLOW' | 'DENY',
    request?: NextRequest
  ): Promise<void> {
    try {
      await auditLogger.logPermissionUsage({
        user_id: userId,
        permission,
        path: request?.url || 'unknown',
        result,
        ip_address: request
          ? auditLogger.constructor.getClientIP(request)
          : undefined,
        user_agent: request
          ? auditLogger.constructor.getUserAgent(request)
          : undefined,
      });
    } catch (error) {
      console.warn('🔐 RBAC: Failed to audit permission check:', error);
    }
  }

  /**
   * Get user's effective permissions for a resource
   */
  async getUserResourcePermissions(
    userId: string,
    resource: string
  ): Promise<string[]> {
    const { permissions } = await permissionCache.getUserPermissions(userId);
    return permissions.filter(permission => {
      const parsed = parsePermission(permission);
      return parsed && parsed.resource === resource;
    });
  }

  /**
   * Get user's effective permissions for a resource-action combination
   */
  async getUserResourceActionPermissions(
    userId: string,
    resource: string,
    action: string
  ): Promise<string[]> {
    const { permissions } = await permissionCache.getUserPermissions(userId);
    return permissions.filter(permission => {
      const parsed = parsePermission(permission);
      return parsed && parsed.resource === resource && parsed.action === action;
    });
  }
}

// Export singleton instance
export const permissionEvaluator = new PermissionEvaluator();
