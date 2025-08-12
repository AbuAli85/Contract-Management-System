'use client';

import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { FormContextProvider } from '@/hooks/use-form-context';
import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

// 🚨 EMERGENCY CIRCUIT BREAKER MODE 🚨
// This safe provider prevents infinite loops by disabling all authentication
// initialization that was causing repeated network requests

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isProfileSynced: boolean;
  supabase: null;
}

// Emergency fallback values - completely safe, no network calls
const SAFE_AUTH_VALUES: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  isProfileSynced: true,
  supabase: null,
};

const AuthContext = createContext<AuthContextType>(SAFE_AUTH_VALUES);

// Emergency SafeAuthContextProvider that does NOTHING
function SafeAuthContextProvider({ children }: { children: React.ReactNode }) {
  console.log(
    '🔐 EMERGENCY MODE: SafeAuthContextProvider using circuit breaker - NO NETWORK CALLS'
  );

  return (
    <AuthContext.Provider value={SAFE_AUTH_VALUES}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabase() {
  console.log('🔐 EMERGENCY MODE: useSupabase using safe fallback values');
  return SAFE_AUTH_VALUES;
}

// Emergency RBAC Provider with safe fallback values
const SAFE_RBAC_VALUES = {
  permissions: [],
  hasPermission: () => false,
  loading: false,
};

const RBACContext = createContext(SAFE_RBAC_VALUES);

function SafeRBACProvider({ children }: { children: React.ReactNode }) {
  console.log(
    '🔐 EMERGENCY MODE: SafeRBACProvider using circuit breaker - NO NETWORK CALLS'
  );

  return (
    <RBACContext.Provider value={SAFE_RBAC_VALUES}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  console.log('🔐 EMERGENCY MODE: useRBAC using safe fallback values');
  return SAFE_RBAC_VALUES;
}

// Main Providers component with emergency circuit breakers
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: false, // Disable retries to prevent loops
          },
        },
      })
  );

  console.log(
    '🚨 EMERGENCY MODE: Providers using full circuit breaker protection'
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAuthContextProvider>
        <SafeRBACProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <FormContextProvider>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                🚨 EMERGENCY CIRCUIT BREAKER ACTIVE - All authentication
                disabled to prevent infinite loops
              </div>
              {children}
            </FormContextProvider>
          </ThemeProvider>
        </SafeRBACProvider>
      </SafeAuthContextProvider>
    </QueryClientProvider>
  );
}
