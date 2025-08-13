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
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('Auth cleared successfully');
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
        if (error.message.includes('refresh') || error.message.includes('Invalid')) {
          console.log('Clearing invalid session...');
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
      console.error('Failed to sign in:', error);
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
      console.error('Failed to sign up:', error);
      throw error;
    }
  }

  // Enhanced sign out with cleanup
  async signOut() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      // Clear local storage and session storage
      await this.clearAuth();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Force clear even if there's an error
      await this.clearAuth();
      throw error;
    }
  }

  // Get current user with error handling
  async getUser() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  // Refresh session with error handling
  async refreshSession() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      // Prevent multiple refresh attempts
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      this.refreshPromise = this.supabase.auth.refreshSession();
      const result = await this.refreshPromise;
      this.refreshPromise = null;

      return result;
    } catch (error) {
      this.refreshPromise = null;
      console.error('Failed to refresh session:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await this.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Failed to check authentication:', error);
      return false;
    }
  }

  // Get user role from session or profile
  async getUserRole(): Promise<string | null> {
    try {
      const { data } = await this.getSession();
      if (!data.session?.user) {
        return null;
      }

      // Try to get role from user metadata first
      const userRole = data.session.user.user_metadata?.role;
      if (userRole) {
        return userRole;
      }

      // Fallback to profile table
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .single();

      if (error) {
        console.error('Failed to get profile role:', error);
        return null;
      }

      return profile?.role || null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates: any) {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  // MFA methods
  async enableMFA() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // This would integrate with your MFA service
      // For now, return a placeholder
      return {
        success: true,
        message: 'MFA setup initiated',
      };
    } catch (error) {
      console.error('Failed to enable MFA:', error);
      throw error;
    }
  }

  async verifyMFA(code: string) {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      // This would integrate with your MFA service
      // For now, return a placeholder
      return {
        success: true,
        message: 'MFA verification successful',
      };
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      throw error;
    }
  }

  async disableMFA() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // This would integrate with your MFA service
      // For now, return a placeholder
      return {
        success: true,
        message: 'MFA disabled successfully',
      };
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      throw error;
    }
  }

  // Get MFA status
  async getMFAStatus() {
    try {
      if (!this.supabase?.auth) {
        throw new Error('Supabase client not available');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check MFA status from database
      const { data, error } = await this.supabase
        .from('user_mfa')
        .select('enabled, verified')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Get MFA status error:', error);
        throw error;
      }

      return {
        enabled: data?.enabled || false,
        verified: data?.verified || false,
      };
    } catch (error) {
      console.error('Failed to get MFA status:', error);
      return {
        enabled: false,
        verified: false,
      };
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
