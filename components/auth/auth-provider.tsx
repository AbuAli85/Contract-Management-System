'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { demoSessionManager, type DemoUser } from '@/lib/auth/demo-session';

interface AuthContextType {
  user: DemoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<DemoUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const currentUser = demoSessionManager.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    console.log('🔐 Auth Provider initialized:', {
      hasUser: !!currentUser,
      isDemoMode: demoSessionManager.isDemoMode(),
      role: currentUser?.role,
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // This would normally call the actual auth service
    // For now, it's handled by the login forms
    return false;
  };

  const logout = () => {
    demoSessionManager.clearSession();
    setUser(null);
    
    // Redirect to home or login
    window.location.href = '/en';
  };

  const updateUser = (updates: Partial<DemoUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      demoSessionManager.updateSession(updates);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && user.authenticated,
    isLoading,
    isDemoMode: demoSessionManager.isDemoMode(),
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for role-based access
export function useRequireAuth(requiredRole?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/en/auth/login';
      return;
    }
    
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard if wrong role
      const dashboardMap = {
        provider: '/en/dashboard/provider-comprehensive',
        admin: '/en/dashboard', 
        client: '/en/dashboard/client-comprehensive',
      };
      
      window.location.href = dashboardMap[user?.role as keyof typeof dashboardMap] || '/en';
      return;
    }
  }, [user, isAuthenticated, isLoading, requiredRole]);
  
  return { user, isAuthenticated, isLoading };
}

// Helper hook for role checking
export function useRole() {
  const { user } = useAuth();
  
  return {
    role: user?.role,
    isProvider: user?.role === 'provider',
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
  };
}
