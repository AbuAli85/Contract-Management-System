import { createClient } from '@/lib/supabase/client';

export class AuthService {
  private static instance: AuthService;
  private supabase: ReturnType<typeof createClient>;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.supabase = createClient();
    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Clear all authentication data
  async clearAuth(): Promise<void> {
    try {
      // Sign out from Supabase
      if (this.supabase?.auth) {
        await this.supabase.auth.signOut();
      }

      // Clear localStorage
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.includes('supabase') || key.includes('sb-')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing auth:', error);
      // Force clear even if there's an error
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  // Safe session retrieval with automatic cleanup on error
  async getSession() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);

        // If it's a refresh token error, clear auth and return null
        if (
          error.message.includes('refresh') ||
          error.message.includes('Invalid')
        ) {
          await this.clearAuth();
          return { session: null, user: null };
        }

        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get session:', error);
      await this.clearAuth();
      return { session: null, user: null };
    }
  }

  // Enhanced sign in with error handling
  async signIn(email: string, password: string) {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      // Clear any existing bad tokens first
      await this.clearAuth();

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  // Enhanced sign up with error handling
  async signUp(email: string, password: string, metadata?: any) {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  // Safe sign out
  async signOut() {
    try {
      if (this.supabase?.auth) {
        await this.supabase.auth.signOut();
      }
      await this.clearAuth();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear even if sign out fails
      await this.clearAuth();
    }
  }

  // Get user with retry logic
  async getUser() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        console.error('Get user error:', error);

        // If it's an auth error, try to get a fresh session
        if (
          error.message.includes('JWT') ||
          error.message.includes('refresh')
        ) {
          const sessionData = await this.getSession();
          return { user: sessionData.session?.user || null };
        }

        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user:', error);
      return { user: null };
    }
  }

  // Test database connectivity
  async testConnection() {
    try {
      if (!this.supabase) {
        return false;
      }

      // Simple query to test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }

  // Enhanced refresh token handling
  async refreshSession() {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();

    try {
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async _performRefresh() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error('Refresh session error:', error);
        // Clear auth on refresh failure
        await this.clearAuth();
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await this.clearAuth();
      throw error;
    }
  }

  // Setup auth state listener with error handling
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!this.supabase?.auth) {
      console.error('Supabase client not available for auth state listener');
      return { data: { subscription: null } };
    }

    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
      } else if (event === 'SIGNED_OUT') {
        await this.clearAuth();
      } else if (event === 'SIGNED_IN') {
      }

      callback(event, session);
    });
  }

  // Get Supabase client
  getClient() {
    return this.supabase;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
