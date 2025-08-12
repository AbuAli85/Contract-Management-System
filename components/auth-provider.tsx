'use client';
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/lib/auth-service';

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
