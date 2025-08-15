'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Remove demo session dependency
// import { demoSessionManager, type DemoUser } from '@/lib/auth/demo-session';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state - NO DEMO MODE
    setUser(null);
    setIsLoading(false);

    console.log('🔐 Auth Provider initialized: No demo mode');
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // This would normally call the actual auth service
    // For now, it's handled by the login forms
    return false;
  };

  const logout = () => {
    // Clear any existing session
    setUser(null);
    
    // Redirect to home or login
    router.push('/en/auth/login');
  };

  const updateUser = (updates: any) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isDemoMode: false, // Always false - no demo mode
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
      router.push('/en/auth/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard if wrong role
      const dashboardMap = {
        provider: '/en/dashboard/provider-comprehensive',
        admin: '/en/dashboard', 
        client: '/en/dashboard/client-comprehensive',
      };
      
      router.push(dashboardMap[user?.role as keyof typeof dashboardMap] || '/en');
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
