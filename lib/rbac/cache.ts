// ========================================
// 🛡️ RBAC PERMISSION CACHING
// ========================================

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface CachedPermissions {
  permissions: string[];
  roles: string[];
  lastRefresh: number;
  expiresAt: number;
}

export interface PermissionCacheOptions {
  ttl: number; // milliseconds
  maxSize: number;
  enableRedis: boolean;
}

const DEFAULT_OPTIONS: PermissionCacheOptions = {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 1000,
  enableRedis: false,
};

class PermissionCache {
  private cache = new Map<string, CachedPermissions>();
  private options: PermissionCacheOptions;
  private redisClient: any = null;

  constructor(options: Partial<PermissionCacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Redis initialization disabled for build compatibility
    // TODO: Re-enable when Redis dependency is properly configured
    return;
  }

  /**
   * Get user permissions from cache or database
   */
  async getUserPermissions(
    userId: string
  ): Promise<{ permissions: string[]; roles: string[] }> {
    if (!userId) {
      return { permissions: [], roles: [] };
    }

    // Try cache first
    const cached = await this.getFromCache(userId);
    if (cached && this.isValid(cached)) {
      return {
        permissions: cached.permissions,
        roles: cached.roles,
      };
    }

    // Fetch from database
    const fresh = await this.fetchFromDatabase(userId);
    if (fresh) {
      await this.setInCache(userId, fresh);
      return {
        permissions: fresh.permissions,
        roles: fresh.roles,
      };
    }

    return { permissions: [], roles: [] };
  }

  /**
   * Get user permissions with specific resource and action
   */
  async getUserPermissionsForResource(
    userId: string,
    resource: string,
    action: string
  ): Promise<string[]> {
    const { permissions } = await this.getUserPermissions(userId);

    return permissions.filter(permission => {
      const parts = permission.split(':');
      return parts.length === 3 && parts[0] === resource && parts[1] === action;
    });
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    requiredPermission: string
  ): Promise<boolean> {
    const { permissions } = await this.getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const { permissions } = await this.getUserPermissions(userId);
    return requiredPermissions.some(permission =>
      permissions.includes(permission)
    );
  }

  /**
   * Check if user has all required permissions
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const { permissions } = await this.getUserPermissions(userId);
    return requiredPermissions.every(permission =>
      permissions.includes(permission)
    );
  }

  /**
   * Invalidate cache for a specific user
   */
  async invalidateUser(userId: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(`rbac:permissions:${userId}`);
      } catch (error) {
        console.warn(
          '🔐 RBAC: Failed to invalidate Redis cache for user:',
          userId,
          error
        );
      }
    }

    this.cache.delete(userId);
  }

  /**
   * Invalidate cache for multiple users
   */
  async invalidateUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map(id => this.invalidateUser(id)));
  }

  /**
   * Invalidate all caches
   */
  async invalidateAll(): Promise<void> {
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys('rbac:permissions:*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.warn('🔐 RBAC: Failed to invalidate Redis cache:', error);
      }
    }

    this.cache.clear();
  }

  /**
   * Refresh cache for a specific user
   */
  async refreshUser(userId: string): Promise<void> {
    await this.invalidateUser(userId);
    await this.getUserPermissions(userId); // This will fetch and cache fresh data
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    redisEnabled: boolean;
    totalCachedUsers: number;
  } {
    return {
      memorySize: this.cache.size,
      redisEnabled: !!this.redisClient,
      totalCachedUsers: this.cache.size,
    };
  }

  /**
   * Clear expired entries from memory cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (!this.isValid(cached)) {
        this.cache.delete(userId);
      }
    }

    // Enforce max size
    if (this.cache.size > this.options.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastRefresh - b[1].lastRefresh);

      const toRemove = entries.slice(0, entries.length - this.options.maxSize);
      toRemove.forEach(([userId]) => this.cache.delete(userId));
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isValid(cached: CachedPermissions): boolean {
    return Date.now() < cached.expiresAt;
  }

  /**
   * Get data from cache (Redis or memory)
   */
  private async getFromCache(
    userId: string
  ): Promise<CachedPermissions | null> {
    // Try Redis first
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(`rbac:permissions:${userId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('🔐 RBAC: Failed to get from Redis cache:', error);
      }
    }

    // Fall back to memory cache
    return this.cache.get(userId) || null;
  }

  /**
   * Set data in cache (Redis and memory)
   */
  private async setInCache(
    userId: string,
    data: { permissions: string[]; roles: string[] }
  ): Promise<void> {
    const now = Date.now();
    const cached: CachedPermissions = {
      ...data,
      lastRefresh: now,
      expiresAt: now + this.options.ttl,
    };

    // Set in Redis
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          `rbac:permissions:${userId}`,
          Math.floor(this.options.ttl / 1000),
          JSON.stringify(cached)
        );
      } catch (error) {
        console.warn('🔐 RBAC: Failed to set Redis cache:', error);
      }
    }

    // Set in memory cache
    this.cache.set(userId, cached);

    // Cleanup expired entries periodically
    if (this.cache.size % 10 === 0) {
      this.cleanupExpired();
    }
  }

  /**
   * Fetch permissions from database
   */
  private async fetchFromDatabase(
    userId: string
  ): Promise<{ permissions: string[]; roles: string[] } | null> {
    try {
      const supabase = getSupabaseAdmin();

      // Try rbac_user_role_assignments view/table (works with both rbac_roles and roles)
      let roleAssignments: any[] | null = null;
      let rolesFetchError: any = null;

      // First attempt: rbac_user_role_assignments with roles table (standard)
      try {
        const r = await supabase
          .from('rbac_user_role_assignments')
          .select(
            `
            role_id,
            roles!rbac_user_role_assignments_role_id_fkey(
              name,
              category
            )
          `
          )
          .eq('user_id', userId)
          .eq('is_active', true);
        roleAssignments = r.data as any[] | null;
        rolesFetchError = r.error;
      } catch (e) {
        rolesFetchError = e;
      }

      // Fallback: Try direct user_roles table query
      if (
        (!roleAssignments || roleAssignments.length === 0) &&
        rolesFetchError
      ) {
        try {
          const { data: userRoleData, error: urError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .eq('user_id', userId)
            .single();

          if (!urError && userRoleData) {
            // Get role details by name
            const { data: roleData, error: roleError } = await supabase
              .from('roles')
              .select('id, name, category')
              .eq('name', userRoleData.role)
              .single();

            if (!roleError && roleData) {
              roleAssignments = [
                {
                  role_id: roleData.id,
                  roles: roleData,
                },
              ];
              rolesFetchError = null;
            }
          }
        } catch (e) {
          console.warn('🔐 RBAC: Fallback to user_roles also failed:', e);
        }
      }

      if (rolesFetchError) {
        console.error('🔐 RBAC: Failed to fetch user roles:', rolesFetchError);
        return null;
      }

      if (!roleAssignments || roleAssignments.length === 0) {
        return { permissions: [], roles: [] };
      }

      const roleIds = roleAssignments.map(ra => ra.role_id);
      const roles = roleAssignments.map(
        ra =>
          // Handle both table naming conventions
          (ra.roles?.name as string) ||
          (ra.rbac_roles?.name as string) ||
          'unknown'
      );

      // Get permissions for these roles (standard tables)
      let permissionsRows: any[] | null = null;
      let permError: any = null;
      try {
        const pr = await supabase
          .from('role_permissions')
          .select(
            `
            permission_id,
            permissions!inner(
              resource,
              action,
              scope,
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

      if (permError) {
        console.error('🔐 RBAC: Failed to fetch permissions:', permError);
        return null;
      }

      const permissionNames = (permissionsRows || [])
        .map(row => row.rbac_permissions?.name || row.permissions?.name)
        .filter(Boolean) as string[];

      return {
        permissions: permissionNames,
        roles,
      };
    } catch (error) {
      console.error(
        '🔐 RBAC: Failed to fetch user permissions from database:',
        error
      );
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.redisClient = null;
      } catch (error) {
        console.warn('🔐 RBAC: Failed to close Redis connection:', error);
      }
    }
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache({
  enableRedis: !!process.env.REDIS_URL,
});
