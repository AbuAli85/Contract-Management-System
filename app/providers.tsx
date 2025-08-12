'use client';

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

// Types
interface User {
  id: string;
  email: string;
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
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
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
  const { user, session, loading, supabase } = useAuth();
  return { user, session, loading, supabase };
}

// Auth Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);

  // Initialize Supabase on client side only
  React.useEffect(() => {
    const initSupabase = async () => {
      try {
        setLoading(true);
        const client = createClient();
        setSupabase(client);

        // Get initial session
        const {
          data: { session },
          error,
        } = await client.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          setSession(session);
          setUser(session.user);
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing Supabase:', error);
        setLoading(false);
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
        } else if (session) {
          setSession(session);
          setUser(session.user);
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
      loading,
      supabase,
      signOut,
      refreshSession,
    }),
    [user, session, loading, supabase, signOut, refreshSession]
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
    [userRole, permissions, hasPermission, hasAnyPermission, hasAllPermissions]
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
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
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
            </EnhancedRBACProvider>
          </RBACProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
