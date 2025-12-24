'use client';

// Filter browser extension errors early
import '@/lib/utils/console-filter';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { EnhancedRBACProvider } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import { Toaster } from 'sonner';
import { syncSessionToSSO, initializeSSOSync } from '@/lib/sso-session-sync';
import { FormContextProvider } from '@/hooks/use-form-context';
import { CompanyProvider } from '@/components/providers/company-provider';

// Types
interface User {
  id: string;
  email?: string; // Make email optional to match Supabase types
  user_metadata?: {
    role?: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at?: number; // Make optional to match Supabase types
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialLoading?: boolean;
  isProfileSynced?: boolean;
  supabase: any;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface RBACContextType {
  userRole: string | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

// Auth Context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  initialLoading: true,
  isProfileSynced: false,
  supabase: null,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useSupabase() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabase must be used within an AuthProvider');
  }
  const {
    user,
    session,
    loading,
    initialLoading,
    isProfileSynced,
    supabase,
    signOut,
    refreshSession,
  } = context;
  return {
    user,
    session,
    loading,
    initialLoading,
    isProfileSynced,
    supabase,
    signOut,
    refreshSession,
  };
}

// Auth Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial auth check
  const [supabase, setSupabase] = useState<any>(null);
  const [isProfileSynced, setIsProfileSynced] = useState(false);

  // Helper function to get proper login URL with locale
  const getLoginUrl = () => {
    // Try to get locale from URL or default to 'en'
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'en';
      return `/${locale}/auth/login`;
    }
    return '/en/auth/login';
  };

  // Initialize Supabase on client side only
  React.useEffect(() => {
    const initSupabase = async () => {
      try {
        setLoading(true);
        setInitialLoading(true);
        const client = createClient();

        if (!client) {
          console.error('Failed to create Supabase client');
          setLoading(false);
          setInitialLoading(false);
          return;
        }

        setSupabase(client);

        // Check for emergency bypass in development
        const hasEmergencyBypass =
          typeof window !== 'undefined' &&
          localStorage.getItem('emergency-bypass') === 'true';

        if (hasEmergencyBypass) {
          console.log(
            '🚨 Emergency bypass detected - preserving existing session'
          );
          // Don't clear sessions when bypass is active
        } else {
          // Only clear sessions if there's a specific security issue
          console.log('🔐 Checking session security...');
          try {
            const {
              data: { session: existingSession },
            } = await client.auth.getSession();
            if (existingSession) {
              // Only clear if it's the blocked admin account
              if (
                existingSession.user.email === 'admin@contractmanagement.com'
              ) {
                console.log(
                  '🚫 Detected blocked admin account - clearing session'
                );
                await client.auth.signOut();
              } else {
                console.log('✅ Valid session found, preserving...');
                // Preserve the existing session
                setSession(existingSession);
                setUser(existingSession.user);
                setLoading(false);
                setInitialLoading(false);
                return;
              }
            } else {
              console.log('ℹ️ No existing sessions to check');
            }
          } catch (error) {
            console.warn('Could not check existing sessions:', error);
          }
        }

        // Clear only specific localStorage items that might cause issues
        try {
          localStorage.removeItem('demo-user-session');
          localStorage.removeItem('user-role');
          localStorage.removeItem('auth-mode');
          // Don't clear Supabase auth tokens - let Supabase handle them
          console.log('🧹 Limited local storage cleanup completed');
        } catch (error) {
          console.warn('Could not clean localStorage:', error);
        }

        // Get initial session with error handling
        try {
          const {
            data: { session },
            error,
          } = await client.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            // If there's a session error, try to clear corrupted data
            try {
              await client.auth.signOut();
            } catch (signOutError) {
              console.warn(
                'Could not sign out after session error:',
                signOutError
              );
            }
            setSession(null);
            setUser(null);
          } else if (session && session.user) {
            // Only set session if user exists and is properly authenticated
            if (session.user.id && session.user.email) {
              // Check if this is the blocked admin account
              if (session.user.email === 'admin@contractmanagement.com') {
                console.warn(
                  '🚫 Detected admin@contractmanagement.com - forcing logout'
                );
                await client.auth.signOut();
                setSession(null);
                setUser(null);
              } else {
                setSession(session);
                setUser(session.user);
                console.log('✅ Authenticated user found:', session.user.email);
                // Sync session to SSO storage key (reads from cookies and syncs to localStorage)
                // This is critical for server-side logins
                try {
                  await syncSessionToSSO();
                  console.log('✅ Session synced to SSO storage');
                } catch (syncError) {
                  console.error('⚠️ Error syncing session to SSO:', syncError);
                }
              }
            } else {
              console.warn('⚠️ Invalid session data, clearing session');
              setSession(null);
              setUser(null);
            }
          } else {
            console.log('ℹ️ No active session found');
            setSession(null);
            setUser(null);
          }
        } catch (sessionError) {
          console.error(
            'Critical session error, clearing all auth data:',
            sessionError
          );
          // Clear all auth data and force fresh start
          try {
            await client.auth.signOut();
          } catch (signOutError) {
            console.warn(
              'Could not sign out after critical error:',
              signOutError
            );
          }
          setSession(null);
          setUser(null);
        }

        // Listen for auth changes with reduced logging
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange(async (event, session) => {
          // Only log important events to reduce console spam
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            console.log('Auth state changed:', event, session?.user?.email);
          }

          if (event === 'SIGNED_IN' && session?.user) {
            if (session.user.id && session.user.email) {
              // DOUBLE CHECK - if this is admin@contractmanagement.com, force logout
              if (session.user.email === 'admin@contractmanagement.com') {
                console.warn(
                  '🚫 Blocked admin@contractmanagement.com login - forcing logout'
                );
                await client.auth.signOut();
                setSession(null);
                setUser(null);
              } else {
                setSession(session);
                setUser(session.user);
                console.log('✅ User signed in:', session.user.email);
                // Sync session to SSO storage key (reads from cookies and syncs to localStorage)
                // Await to ensure cookies are set before API calls
                try {
                  await syncSessionToSSO();
                  console.log('✅ Session synced to SSO storage');
                } catch (syncError) {
                  console.error('⚠️ Error syncing session to SSO:', syncError);
                }
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            console.log('✅ User signed out');
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            if (session.user.id && session.user.email) {
              // DOUBLE CHECK - if this is admin@contractmanagement.com, force logout
              if (session.user.email === 'admin@contractmanagement.com') {
                console.warn(
                  '🚫 Blocked admin@contractmanagement.com token refresh - forcing logout'
                );
                await client.auth.signOut();
                setSession(null);
                setUser(null);
              } else {
                setSession(session);
                setUser(session.user);
                // Sync session to SSO storage key on token refresh
                try {
                  await syncSessionToSSO();
                } catch (syncError) {
                  console.error('⚠️ Error syncing session to SSO:', syncError);
                }
              }
            }
          }
        });

        // Initialize SSO session sync
        initializeSSOSync();

        setLoading(false);
        setInitialLoading(false); // Mark initial auth check as complete
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing Supabase:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        setInitialLoading(false); // Mark initial auth check as complete even on error
        return () => {}; // Return empty cleanup function
      }
    };

    initSupabase();
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        console.log('✅ User signed out successfully');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      if (supabase) {
        const {
          data: { session },
          error,
        } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Error refreshing session:', error);
        } else if (session && session.user) {
          if (session.user.id && session.user.email) {
            // DOUBLE CHECK - if this is admin@contractmanagement.com, force logout
            if (session.user.email === 'admin@contractmanagement.com') {
              console.warn(
                '🚫 Blocked admin@contractmanagement.com token refresh - forcing logout'
              );
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
            } else {
              setSession(session);
              setUser(session.user);
              console.log('✅ Session refreshed for:', session.user.email);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }, [supabase]);

  const authValue = useMemo(
    () => ({
      user,
      session,
      loading: loading || initialLoading, // Combined loading state prevents premature redirects
      initialLoading, // Separate flag for initial auth check
      isProfileSynced,
      supabase,
      signOut,
      refreshSession,
    }),
    [user, session, loading, initialLoading, isProfileSynced] // Added new states to deps
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}

// RBAC Context
const RBACContext = createContext<RBACContextType>({
  userRole: null,
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}

export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } =
    useRBAC();
  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}

// RBAC Provider
function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  React.useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || 'user';
      setUserRole(role);

      const rolePermissions = {
        'super-admin': [
          'read',
          'write',
          'delete',
          'manage_users',
          'manage_contracts',
          'manage_system',
          'view_audit_logs',
        ],
        admin: [
          'read',
          'write',
          'delete',
          'manage_users',
          'manage_contracts',
          'view_audit_logs',
        ],
        manager: ['read', 'write', 'manage_contracts', 'view_reports'],
        moderator: ['read', 'write', 'moderate_content'],
        user: ['read', 'write'],
        viewer: ['read'],
      };
      setPermissions(
        rolePermissions[role as keyof typeof rolePermissions] || ['read']
      );
    } else {
      setUserRole(null);
      setPermissions([]);
    }
  }, [user]);

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some(permission => permissions.includes(permission));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every(permission => permissions.includes(permission));
    },
    [permissions]
  );

  const rbacValue = useMemo(
    () => ({
      userRole,
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [userRole, permissions] // Removed functions from deps
  );

  return (
    <RBACContext.Provider value={rbacValue}>{children}</RBACContext.Provider>
  );
}

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes default - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: true, // Refetch on window focus for fresh data
            refetchOnReconnect: true, // Refetch on reconnect
            refetchOnMount: true, // Refetch on mount if stale
          },
          mutations: {
            retry: 1,
            onError: error => {
              console.error('Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <RBACProvider>
            <EnhancedRBACProvider>
              <CompanyProvider>
                <FormContextProvider>
                  {children}
                <Toaster
                  position='top-right'
                  expand={false}
                  richColors
                  closeButton
                  duration={4000}
                  toastOptions={{
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                  }}
                />
                </FormContextProvider>
              </CompanyProvider>
            </EnhancedRBACProvider>
          </RBACProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
