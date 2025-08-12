// Demo session management for offline mode

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: 'provider' | 'admin' | 'client';
  company: string;
  authenticated: boolean;
  authMode: 'offline' | 'online';
  loginTime: string;
}

export interface DemoSession {
  user: DemoUser;
}

export class DemoSessionManager {
  private static instance: DemoSessionManager;
  private sessionKey = 'demo-user-session';
  private roleKey = 'user-role';
  private authModeKey = 'auth-mode';

  static getInstance(): DemoSessionManager {
    if (!DemoSessionManager.instance) {
      DemoSessionManager.instance = new DemoSessionManager();
    }
    return DemoSessionManager.instance;
  }

  // Create demo session
  createSession(user: Omit<DemoUser, 'id' | 'authenticated' | 'authMode' | 'loginTime'>): DemoSession {
    const demoUser: DemoUser = {
      ...user,
      id: `demo-${user.role}-${Date.now()}`,
      authenticated: true,
      authMode: 'offline',
      loginTime: new Date().toISOString(),
    };

    const session: DemoSession = { user: demoUser };

    // Store in localStorage
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    localStorage.setItem(this.roleKey, user.role);
    localStorage.setItem(this.authModeKey, 'offline-demo');

    console.log('✅ Demo session created:', user.role);
    return session;
  }

  // Get current session
  getSession(): DemoSession | null {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as DemoSession;
      
      // Validate session
      if (!session.user || !session.user.authenticated) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting demo session:', error);
      this.clearSession();
      return null;
    }
  }

  // Get current user
  getCurrentUser(): DemoUser | null {
    const session = this.getSession();
    return session?.user || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getSession();
    return session?.user?.authenticated || false;
  }

  // Get user role
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || localStorage.getItem(this.roleKey);
  }

  // Check if in demo mode
  isDemoMode(): boolean {
    return localStorage.getItem(this.authModeKey) === 'offline-demo';
  }

  // Clear session
  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.authModeKey);
    console.log('🧹 Demo session cleared');
  }

  // Update session
  updateSession(updates: Partial<DemoUser>): boolean {
    const session = this.getSession();
    if (!session) return false;

    const updatedUser = { ...session.user, ...updates };
    const updatedSession = { user: updatedUser };

    localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
    console.log('✅ Demo session updated');
    return true;
  }

  // Check session validity
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check if session is too old (optional - for demo purposes, sessions don't expire)
    // const loginTime = new Date(session.user.loginTime);
    // const now = new Date();
    // const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    // return hoursSinceLogin < 24; // 24 hour session

    return session.user.authenticated;
  }

  // Get session info for debugging
  getSessionInfo() {
    const session = this.getSession();
    return {
      hasSession: !!session,
      isAuthenticated: this.isAuthenticated(),
      role: this.getUserRole(),
      isDemoMode: this.isDemoMode(),
      user: session?.user || null,
    };
  }
}

// Export singleton instance
export const demoSessionManager = DemoSessionManager.getInstance();

// Helper functions for easy access
export const getCurrentDemoUser = () => demoSessionManager.getCurrentUser();
export const isDemoAuthenticated = () => demoSessionManager.isAuthenticated();
export const getDemoUserRole = () => demoSessionManager.getUserRole();
export const isDemoMode = () => demoSessionManager.isDemoMode();
export const clearDemoSession = () => demoSessionManager.clearSession();
