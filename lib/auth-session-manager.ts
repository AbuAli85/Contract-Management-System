'use client';

import { createClient } from '@/lib/supabase/client';

export interface UserSession {
  user: any;
  session: any;
  profile?: any;
  lastActivity: number;
}

export class AuthSessionManager {
  private static instance: AuthSessionManager;
  private supabase = createClient();
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeSessionMonitoring();
  }

  public static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager();
    }
    return AuthSessionManager.instance;
  }

  private initializeSessionMonitoring() {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, this.CHECK_INTERVAL);

    // Listen for auth state changes
    this.supabase?.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        this.storeSession(session);
        this.updateLastActivity();
      } else if (event === 'SIGNED_OUT') {
        this.clearSession();
      }
    });
  }

  public async getCurrentSession(): Promise<UserSession | null> {
    try {
      if (!this.supabase) return null;
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 Session retrieval error:', error);
        return null;
      }

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        console.log('🔐 Session expired, signing out');
        await this.signOut();
        return null;
      }

      // Get user profile
      const profile = await this.getUserProfile(session.user.id);
      
      return {
        user: session.user,
        session: session,
        profile: profile,
        lastActivity: this.getLastActivity(),
      };
    } catch (error) {
      console.error('🔐 Session check error:', error);
      return null;
    }
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; session?: UserSession }> {
    try {
      if (!this.supabase) return { success: false, error: 'Supabase client not initialized' };
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('🔐 Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!data.session) {
        return { success: false, error: 'No session created' };
      }

      // Store session and update activity
      this.storeSession(data.session);
      this.updateLastActivity();

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);

      const userSession: UserSession = {
        user: data.user,
        session: data.session,
        profile: profile,
        lastActivity: Date.now(),
      };

      return { success: true, session: userSession };
    } catch (error) {
      console.error('🔐 Sign in exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  public async signOut(): Promise<void> {
    try {
      if (!this.supabase) return;
      await this.supabase.auth.signOut();
      this.clearSession();
    } catch (error) {
      console.error('🔐 Sign out error:', error);
    }
  }

  public updateLastActivity(): void {
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  public getLastActivity(): number {
    const stored = localStorage.getItem('lastActivity');
    return stored ? parseInt(stored, 10) : Date.now();
  }

  private storeSession(session: any): void {
    try {
      localStorage.setItem('userSession', JSON.stringify({
        user: session.user,
        session: session,
        lastActivity: Date.now(),
      }));
    } catch (error) {
      console.error('🔐 Session storage error:', error);
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem('userSession');
      localStorage.removeItem('lastActivity');
    } catch (error) {
      console.error('🔐 Session clear error:', error);
    }
  }

  private isSessionExpired(session: any): boolean {
    if (!session?.expires_at) return true;
    
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    
    return now >= expiresAt;
  }

  private async checkSessionValidity(): Promise<void> {
    try {
      if (!this.supabase) return;
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session && this.isSessionExpired(session)) {
        console.log('🔐 Session expired during check, signing out');
        await this.signOut();
      }
    } catch (error) {
      console.error('🔐 Session validity check error:', error);
    }
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      if (!this.supabase) return null;
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, full_name, role, status')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('🔐 Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('🔐 Profile fetch exception:', error);
      return null;
    }
  }

  public destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Export singleton instance
export const authSessionManager = AuthSessionManager.getInstance();
