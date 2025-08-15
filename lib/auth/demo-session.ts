// Demo session management for offline mode - COMPLETELY DISABLED FOR PRODUCTION

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
  
  // COMPLETELY DISABLE DEMO MODE
  private demoModeEnabled = false;

  static getInstance(): DemoSessionManager {
    if (!DemoSessionManager.instance) {
      DemoSessionManager.instance = new DemoSessionManager();
      // Immediately disable demo mode and clear any existing sessions
      DemoSessionManager.instance.disableDemoMode();
    }
    return DemoSessionManager.instance;
  }

  // Create demo session - COMPLETELY DISABLED
  createSession(user: Omit<DemoUser, 'id' | 'authenticated' | 'authMode' | 'loginTime'>): null {
    console.warn('🚫 Demo mode is completely disabled. Cannot create demo session.');
    return null;
  }

  // Get current session - COMPLETELY DISABLED
  getSession(): null {
    console.warn('🚫 Demo mode is completely disabled. Cannot get demo session.');
    return null;
  }

  // Get current user - COMPLETELY DISABLED
  getCurrentUser(): null {
    console.warn('🚫 Demo mode is completely disabled. Cannot get demo user.');
    return null;
  }

  // Check if user is authenticated - COMPLETELY DISABLED
  isAuthenticated(): false {
    return false;
  }

  // Get user role - COMPLETELY DISABLED
  getUserRole(): null {
    return null;
  }

  // Check if in demo mode - COMPLETELY DISABLED
  isDemoMode(): false {
    return false;
  }

  // Clear session - ALWAYS CLEAR
  clearSession(): void {
    try {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.roleKey);
      localStorage.removeItem(this.authModeKey);
      console.log('🧹 Demo sessions cleared (demo mode disabled)');
    } catch (error) {
      console.warn('Could not clear demo sessions:', error);
    }
  }

  // Update session - COMPLETELY DISABLED
  updateSession(updates: Partial<DemoUser>): false {
    console.warn('🚫 Demo mode is completely disabled. Cannot update demo session.');
    return false;
  }

  // Check session validity - COMPLETELY DISABLED
  isSessionValid(): false {
    return false;
  }

  // Get session info for debugging
  getSessionInfo() {
    return {
      hasSession: false,
      isAuthenticated: false,
      role: null,
      isDemoMode: false,
      user: null,
      demoModeEnabled: false,
      status: 'DEMO_MODE_DISABLED'
    };
  }

  // Enable demo mode (for development only) - DISABLED
  enableDemoMode(): void {
    console.warn('🚫 Demo mode cannot be enabled - completely disabled for security');
    this.demoModeEnabled = false;
  }

  // Disable demo mode (default and permanent)
  disableDemoMode(): void {
    this.demoModeEnabled = false;
    this.clearSession();
    console.log('🔒 Demo mode permanently disabled for security');
  }

  // Force clear all demo data
  forceClearAll(): void {
    try {
      // Clear all possible demo-related data
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.roleKey);
      localStorage.removeItem(this.authModeKey);
      localStorage.removeItem('demo-user-session');
      localStorage.removeItem('user-role');
      localStorage.removeItem('auth-mode');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      console.log('🧹 All demo and auth data cleared');
    } catch (error) {
      console.warn('Could not clear all data:', error);
    }
  }
}

// Export singleton instance
export const demoSessionManager = DemoSessionManager.getInstance();

// Helper functions for easy access - ALL COMPLETELY DISABLED
export const getCurrentDemoUser = () => null;
export const isDemoAuthenticated = () => false;
export const getDemoUserRole = () => null;
export const isDemoMode = () => false;
export const clearDemoSession = () => demoSessionManager.clearSession();

// Initialize with demo mode completely disabled and clear all data
demoSessionManager.disableDemoMode();
demoSessionManager.forceClearAll();

// Additional cleanup on module load
if (typeof window !== 'undefined') {
  // Clear any existing demo sessions immediately
  try {
    localStorage.removeItem('demo-user-session');
    localStorage.removeItem('user-role');
    localStorage.removeItem('auth-mode');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    console.log('🧹 Immediate cleanup of demo sessions completed');
  } catch (error) {
    console.warn('Could not perform immediate cleanup:', error);
  }
}
