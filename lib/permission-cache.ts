/**
 * Permission Caching Service
 * Reduces database queries by caching permission checks
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class PermissionCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key for user permissions
   */
  getUserPermissionKey(userId: string): string {
    return `user_permission_${userId}`;
  }

  /**
   * Generate cache key for user role
   */
  getUserRoleKey(userId: string): string {
    return `user_role_${userId}`;
  }
}

// Singleton instance
export const permissionCache = new PermissionCache();

// Clear expired entries every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    permissionCache.clearExpired();
  }, 60 * 1000);
}
