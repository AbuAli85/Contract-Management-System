/**
 * Enhanced authentication session manager with performance optimizations
 * Part of Critical Path Optimization Guide implementation
 */
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface SessionCache {
  session: Session | null;
  user: User | null;
  permissions: string[];
  lastRefresh: number;
  expiresAt: number;
}

interface AuthOptimizationConfig {
  cacheEnabled: boolean;
  sessionRefreshBuffer: number; // minutes before expiry to refresh
  permissionCacheDuration: number; // milliseconds
  backgroundRefreshEnabled: boolean;
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

class OptimizedAuthManager {
  private static instance: OptimizedAuthManager;
  private supabase = createClient();
  private sessionCache: SessionCache | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private backgroundRefreshWorker: Worker | null = null;

  private config: AuthOptimizationConfig = {
    cacheEnabled: true,
    sessionRefreshBuffer: 5, // Refresh 5 minutes before expiry
    permissionCacheDuration: 10 * 60 * 1000, // 10 minutes
    backgroundRefreshEnabled: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    },
  };

  private constructor() {
    this.initializeAuthOptimizations();
  }

  static getInstance(): OptimizedAuthManager {
    if (!OptimizedAuthManager.instance) {
      OptimizedAuthManager.instance = new OptimizedAuthManager();
    }
    return OptimizedAuthManager.instance;
  }

  private initializeAuthOptimizations() {
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.cacheSession(session);
        this.scheduleSessionRefresh(session);
      } else if (event === 'SIGNED_OUT') {
        this.clearCache();
        this.clearRefreshTimer();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.cacheSession(session);
        this.scheduleSessionRefresh(session);
      }
    });

    // Initialize background refresh worker if supported
    if (this.config.backgroundRefreshEnabled && typeof Worker !== 'undefined') {
      this.initializeBackgroundWorker();
    }

    // Load cached session on initialization
    this.loadCachedSession();
  }

  private async cacheSession(session: Session) {
    if (!this.config.cacheEnabled) return;

    try {
      // Fetch user permissions and cache them
      const permissions = await this.fetchUserPermissions(session.user.id);

      const sessionCache: SessionCache = {
        session,
        user: session.user,
        permissions,
        lastRefresh: Date.now(),
        expiresAt: session.expires_at
          ? session.expires_at * 1000
          : Date.now() + 60 * 60 * 1000, // 1 hour default
      };

      this.sessionCache = sessionCache;

      // Store in sessionStorage for persistence across tabs
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'auth_cache',
            JSON.stringify({
              permissions,
              lastRefresh: sessionCache.lastRefresh,
              expiresAt: sessionCache.expiresAt,
            })
          );
        } catch (e) {
          console.warn('Failed to cache session in sessionStorage:', e);
        }
      }
    } catch (error) {
      console.error('❌ Failed to cache session:', error);
    }
  }

  private async fetchUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(
          `
          role:roles!inner(
            role_permissions!inner(
              permission:permissions!inner(name)
            )
          )
        `
        )
        .eq('user_id', userId);

      if (error) throw error;

      const permissions: string[] = [];

      data?.forEach(item => {
        if (item.role && 'role_permissions' in item.role) {
          const rolePermissions = item.role.role_permissions as any[];
          rolePermissions?.forEach(rp => {
            if (rp.permission && typeof rp.permission.name === 'string') {
              permissions.push(rp.permission.name);
            }
          });
        }
      });

      return [...new Set(permissions)]; // Remove duplicates
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }
  }

  private scheduleSessionRefresh(session: Session) {
    this.clearRefreshTimer();

    const expiresAt = session.expires_at
      ? session.expires_at * 1000
      : Date.now() + 60 * 60 * 1000;
    const refreshTime =
      expiresAt - this.config.sessionRefreshBuffer * 60 * 1000;
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession();
      }, timeUntilRefresh);
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearCache() {
    this.sessionCache = null;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('auth_cache');
      } catch (e) {
        console.warn('Failed to clear session cache:', e);
      }
    }
  }

  private loadCachedSession() {
    if (typeof window === 'undefined' || !this.config.cacheEnabled) return;

    try {
      const cached = sessionStorage.getItem('auth_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();

        // Check if cached permissions are still valid
        if (
          parsedCache.expiresAt > now &&
          now - parsedCache.lastRefresh < this.config.permissionCacheDuration
        ) {
        }
      }
    } catch (e) {
      console.warn('Failed to load cached session:', e);
    }
  }

  private async refreshSession(): Promise<boolean> {
    let retries = 0;
    const { maxRetries, baseDelay, maxDelay } = this.config.retryConfig;

    while (retries < maxRetries) {
      try {
        const { data, error } = await this.supabase.auth.refreshSession();

        if (error) throw error;

        if (data?.session) {
          return true;
        }

        throw new Error('No session returned from refresh');
      } catch (error) {
        retries++;
        console.error(`❌ Session refresh attempt ${retries} failed:`, error);

        if (retries < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(2, retries - 1),
            maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ Session refresh failed after all retries');
    return false;
  }

  private initializeBackgroundWorker() {
    try {
      // Create background worker for session management
      const workerScript = `
        let refreshTimer = null;
        
        self.addEventListener('message', function(e) {
          const { type, data } = e.data;
          
          if (type === 'SCHEDULE_REFRESH') {
            if (refreshTimer) {
              clearTimeout(refreshTimer);
            }
            
            refreshTimer = setTimeout(() => {
              self.postMessage({ type: 'REFRESH_SESSION' });
            }, data.timeUntilRefresh);
          } else if (type === 'CLEAR_TIMER') {
            if (refreshTimer) {
              clearTimeout(refreshTimer);
              refreshTimer = null;
            }
          }
        });
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.backgroundRefreshWorker = new Worker(URL.createObjectURL(blob));

      this.backgroundRefreshWorker.addEventListener('message', e => {
        if (e.data.type === 'REFRESH_SESSION') {
          this.refreshSession();
        }
      });
    } catch (error) {
      console.warn('Failed to initialize background worker:', error);
    }
  }

  // Public API methods
  async getCurrentSession(): Promise<Session | null> {
    if (
      this.sessionCache?.session &&
      this.sessionCache.expiresAt > Date.now()
    ) {
      return this.sessionCache.session;
    }

    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.sessionCache?.user && this.sessionCache.expiresAt > Date.now()) {
      return this.sessionCache.user;
    }

    try {
      if (!this.supabase?.auth) {
        console.error('Supabase auth not available');
        return null;
      }

      const authResponse = await this.supabase.auth.getUser();
      return authResponse?.data?.user || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  getCachedPermissions(): string[] {
    if (
      this.sessionCache &&
      Date.now() - this.sessionCache.lastRefresh <
        this.config.permissionCacheDuration
    ) {
      return this.sessionCache.permissions;
    }
    return [];
  }

  async hasPermission(permission: string): Promise<boolean> {
    const cachedPermissions = this.getCachedPermissions();
    if (cachedPermissions.length > 0) {
      return cachedPermissions.includes(permission);
    }

    // Fallback to fresh fetch if not cached
    const user = await this.getCurrentUser();
    if (!user) return false;

    const permissions = await this.fetchUserPermissions(user.id);
    return permissions.includes(permission);
  }

  getSessionHealth(): {
    isValid: boolean;
    expiresIn: number;
    needsRefresh: boolean;
    cacheHealth: string;
  } {
    const now = Date.now();
    const session = this.sessionCache;

    if (!session) {
      return {
        isValid: false,
        expiresIn: 0,
        needsRefresh: true,
        cacheHealth: 'no_cache',
      };
    }

    const expiresIn = session.expiresAt - now;
    const needsRefresh =
      expiresIn < this.config.sessionRefreshBuffer * 60 * 1000;
    const cacheAge = now - session.lastRefresh;

    let cacheHealth = 'good';
    if (cacheAge > this.config.permissionCacheDuration) {
      cacheHealth = 'stale';
    } else if (cacheAge > this.config.permissionCacheDuration / 2) {
      cacheHealth = 'aging';
    }

    return {
      isValid: expiresIn > 0,
      expiresIn: Math.max(0, expiresIn),
      needsRefresh,
      cacheHealth,
    };
  }

  // Cleanup method
  destroy() {
    this.clearRefreshTimer();
    this.clearCache();

    if (this.backgroundRefreshWorker) {
      this.backgroundRefreshWorker.terminate();
      this.backgroundRefreshWorker = null;
    }
  }
}

// Export singleton instance
export const authManager = OptimizedAuthManager.getInstance();

// React hook for optimized auth
export function useOptimizedAuth() {
  return {
    authManager,
    getCurrentSession: () => authManager.getCurrentSession(),
    getCurrentUser: () => authManager.getCurrentUser(),
    hasPermission: (permission: string) =>
      authManager.hasPermission(permission),
    getCachedPermissions: () => authManager.getCachedPermissions(),
    getSessionHealth: () => authManager.getSessionHealth(),
  };
}
