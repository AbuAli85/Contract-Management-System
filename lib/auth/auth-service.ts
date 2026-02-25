import { createClient } from '@/lib/supabase/client';

export class AuthService {
  private static instance: AuthService;
  private supabase: ReturnType<typeof createClient>;

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
        throw error;
      }

      return data;
    } catch (error) {
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
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Sign out with cleanup
  async signOut() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear local storage and session storage
      await this.clearAuth();

      return { success: true };
    } catch (error) {
      // Force clear even if there's an error
      await this.clearAuth();
      throw error;
    }
  }

  // Get current user
  async getUser() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates: any) {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Refresh session
  async refreshSession() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { session } = await this.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  // Get user role from database
  async getUserRole(): Promise<string | null> {
    try {
      const { user } = await this.getUser();
      if (!user) return null;

      // Try to get role from profiles table first
      const { data: profileData, error: profileErr } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileErr && profileData?.role) {
        return profileData.role;
      }

      // If no role from profiles, try users table
      const { data: userData, error: userErr } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userErr && userData?.role) {
        return userData.role;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check if user has specific permission
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      if (!role) return false;

      // Admin has all permissions
      if (role === 'admin') return true;

      // Manager has most permissions except admin-only ones
      if (role === 'manager') {
        const adminOnlyPermissions = [
          'users.delete',
          'system.settings',
          'system.backup',
        ];
        return !adminOnlyPermissions.includes(permission);
      }

      // User has basic permissions
      if (role === 'user') {
        const userPermissions = [
          'contracts.view',
          'contracts.create',
          'contracts.edit',
          'dashboard.view',
          'profile.edit',
        ];
        return userPermissions.includes(permission);
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
