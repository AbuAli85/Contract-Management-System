'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, LogIn, AlertCircle, RefreshCw } from 'lucide-react';

// Global state to prevent multiple simultaneous auth checks
const globalAuthState: {
  isChecking: boolean;
  lastCheck: number;
  user: any | null;
  error: string | null;
  lastSuccessfulCheck: number;
} = {
  isChecking: false,
  lastCheck: 0,
  user: null,
  error: null,
  lastSuccessfulCheck: 0,
};

// Global rate limiting
const AUTH_CHECK_INTERVAL = 300000; // 5 minutes instead of 2 minutes
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 1; // Only 1 request per minute

// Global request deduplication
let pendingAuthCheck: Promise<any> | null = null;

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles = [],
}: AuthGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCheckingRef = useRef(false);
  const isMountedRef = useRef(true);

  const checkAuth = useCallback(
    async (force = false) => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('⏱️ AuthGuard: Component unmounted, skipping auth check');
        return;
      }

      // Global rate limiting check
      const now = Date.now();
      if (!force && now - globalAuthState.lastCheck < AUTH_CHECK_INTERVAL) {
        console.log('⏱️ AuthGuard: Using cached auth state (rate limited)');
        if (globalAuthState.user) {
          setUser(globalAuthState.user);
          setError(globalAuthState.error);
        }
        setLoading(false);
        return;
      }

      // Check if there's already a pending auth check
      if (pendingAuthCheck && !force) {
        console.log('⏱️ AuthGuard: Waiting for pending auth check...');
        try {
          const result = await pendingAuthCheck;
          if (isMountedRef.current && result.user) {
            setUser(result.user);
            setError(result.error);
          }
          if (isMountedRef.current) {
            setLoading(false);
          }
          return;
        } catch (error) {
          console.log(
            '⚠️ AuthGuard: Pending auth check failed, proceeding with new check'
          );
        }
      }

      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        console.log('⏱️ AuthGuard: Already checking, skipping...');
        return;
      }

      // Check if we're being rate limited
      if (now - globalAuthState.lastCheck < RATE_LIMIT_WINDOW) {
        console.log('⏱️ AuthGuard: Rate limiting - skipping check');
        return;
      }

      isCheckingRef.current = true;
      globalAuthState.isChecking = true;

      // Create the auth check promise for deduplication
      pendingAuthCheck = performAuthCheck();

      try {
        const result = await pendingAuthCheck;

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          if (result.user) {
            setUser(result.user);
            setError(result.error);
            globalAuthState.user = result.user;
            globalAuthState.error = result.error;
            globalAuthState.lastSuccessfulCheck = now;
          } else {
            setUser(null);
            setError(result.error);
            globalAuthState.user = null;
            globalAuthState.error = result.error;
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('❌ AuthGuard: Error during auth check:', error);
          setError('Authentication error');
          setUser(null);
          globalAuthState.user = null;
          globalAuthState.error = 'Authentication error';
          setLoading(false);
        }
      } finally {
        if (isMountedRef.current) {
          isCheckingRef.current = false;
          globalAuthState.isChecking = false;
          globalAuthState.lastCheck = now;
          pendingAuthCheck = null;
        }
      }
    },
    [allowedRoles]
  );

  // Separate function for the actual auth check
  const performAuthCheck = async () => {
    try {
      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      console.log('🔐 AuthGuard: Checking authentication...');

      const response = await fetch('/api/auth/check-session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        signal: abortController.signal,
      });

      if (response.status === 429) {
        console.warn('⚠️ AuthGuard: Rate limited, will retry later');
        return {
          user: null,
          error: 'Too many requests. Please wait a moment and try again.',
        };
      }

      if (response.ok) {
        const data = await response.json();

        if (data.authenticated && data.user && data.user.id) {
          // Check role permissions if specified
          if (
            allowedRoles.length > 0 &&
            !allowedRoles.includes(data.user.role)
          ) {
            const errorMsg = `Access denied. Required role: ${allowedRoles.join(' or ')}`;
            console.warn('🚫 AuthGuard:', errorMsg);
            return { user: null, error: errorMsg };
          } else {
            console.log(
              '✅ AuthGuard: User authenticated:',
              data.user.email || data.user.id
            );
            return { user: data.user, error: null };
          }
        } else {
          // Treat unauthenticated responses quietly to reduce console noise
          return { user: null, error: 'Authentication required' };
        }
      } else {
        console.warn(
          '⚠️ AuthGuard: Authentication check failed:',
          response.status
        );
        return { user: null, error: 'Authentication check failed' };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔄 AuthGuard: Request aborted');
        return { user: null, error: 'Request aborted' };
      }

      console.error('❌ AuthGuard: Error checking authentication:', error);
      return { user: null, error: 'Authentication error' };
    }
  };

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    if (!requireAuth) {
      setLoading(false);
      return;
    }

    // Set up console commands for development
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined'
    ) {
      // @ts-ignore - Adding to window for development
      window.enableBypass = () => {
        localStorage.setItem('emergency-bypass', 'true');
        localStorage.setItem('dev-bypass', 'true');
        localStorage.setItem('force-bypass', 'true');
        console.log('🚨 Bypass enabled via console command');
        window.location.reload();
      };

      // @ts-ignore - Adding to window for development
      window.disableBypass = () => {
        localStorage.removeItem('emergency-bypass');
        localStorage.removeItem('dev-bypass');
        localStorage.removeItem('force-bypass');
        console.log('🚨 Bypass disabled via console command');
        window.location.reload();
      };

      // @ts-ignore - Adding to window for development
      window.forceAuth = (email: string, role: string = 'user') => {
        const mockUser = {
          id: `emergency-user-${Date.now()}`,
          email,
          role,
          full_name: 'Emergency User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_metadata: { role },
        };

        globalAuthState.user = mockUser;
        globalAuthState.error = null;
        globalAuthState.lastSuccessfulCheck = Date.now();

        if (isMountedRef.current) {
          setUser(mockUser);
          setError(null);
          setLoading(false);
        }

        console.log('🚨 Force auth enabled for:', email, 'with role:', role);
      };

      // @ts-ignore - Adding to window for development
      window.switchToUser = (email: string) => {
        const userMap: Record<string, { role: string; name: string }> = {
          'luxsess2001@gmail.com': { role: 'admin', name: 'Luxsess Admin' },
          'admin@example.com': { role: 'admin', name: 'System Administrator' },
          'manager@example.com': { role: 'manager', name: 'Project Manager' },
          'promoter@example.com': { role: 'promoter', name: 'Sales Promoter' },
          'client@example.com': { role: 'client', name: 'Business Client' },
        };

        const userInfo = userMap[email];
        if (userInfo) {
          const mockUser = {
            id: `test-user-${Date.now()}`,
            email,
            role: userInfo.role,
            full_name: userInfo.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: { role: userInfo.role },
          };

          globalAuthState.user = mockUser;
          globalAuthState.error = null;
          globalAuthState.lastSuccessfulCheck = Date.now();

          if (isMountedRef.current) {
            setUser(mockUser);
            setError(null);
            setLoading(false);
          }

          console.log(
            '🔄 Switched to user:',
            email,
            'with role:',
            userInfo.role
          );
        } else {
          console.log(
            '❌ User not found. Available users:',
            Object.keys(userMap)
          );
        }
      };

      // @ts-ignore - Adding to window for development
      window.listUsers = () => {
        console.log('👥 Available test users:');
        console.log(
          '  window.switchToUser("luxsess2001@gmail.com")     - Admin (Luxsess)'
        );
        console.log(
          '  window.switchToUser("admin@example.com")         - Admin (System)'
        );
        console.log(
          '  window.switchToUser("manager@example.com")       - Manager'
        );
        console.log(
          '  window.switchToUser("promoter@example.com")      - Promoter'
        );
        console.log(
          '  window.switchToUser("client@example.com")        - Client'
        );
        console.log('');
        console.log(
          '  window.forceAuth("email@example.com", "role")    - Custom user'
        );
        console.log(
          '  window.enableBypass()                            - Enable bypass'
        );
        console.log(
          '  window.disableBypass()                           - Disable bypass'
        );
      };

      console.log('🔧 Development console commands available:');
      console.log('  window.enableBypass()  - Enable emergency bypass');
      console.log('  window.disableBypass() - Disable emergency bypass');
      console.log(
        '  window.forceAuth("email@example.com", "admin") - Force authentication'
      );
      console.log(
        '  window.switchToUser("email@example.com") - Switch to test user'
      );
      console.log('  window.listUsers() - List all available test users');
    }

    // Initial check with a small delay to prevent rapid re-renders
    const initialCheckTimer = setTimeout(() => {
      if (isMountedRef.current) {
        checkAuth(true);
      }
    }, 100);

    // Set up periodic check with reduced frequency
    const interval = setInterval(() => {
      if (
        isMountedRef.current &&
        !isCheckingRef.current &&
        !globalAuthState.isChecking &&
        !pendingAuthCheck
      ) {
        checkAuth();
      }
    }, AUTH_CHECK_INTERVAL); // Check every 5 minutes instead of 2 minutes

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      clearTimeout(initialCheckTimer);
      clearInterval(interval);

      // Only abort if we have a current request and it's not completed
      if (abortControllerRef.current && isCheckingRef.current) {
        console.log(
          '🔄 AuthGuard: Aborting pending auth request due to unmount'
        );
        abortControllerRef.current.abort();
      }

      // Clear pending auth check on unmount
      pendingAuthCheck = null;
    };
  }, [requireAuth, checkAuth]);

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state for authentication failures
  if (error || (requireAuth && !user)) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <Shield className='h-6 w-6 text-red-600' />
            </div>
            <CardTitle className='text-xl text-red-600'>
              Access Denied
            </CardTitle>
            <CardDescription>
              {error || 'Authentication required to access this page'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center text-sm text-gray-600'>
              <AlertCircle className='inline h-4 w-4 mr-1' />
              Please log in to continue
            </div>
            <div className='flex space-x-3'>
              <Button
                onClick={() => router.push(`/${locale}/auth/login`)}
                className='flex-1'
              >
                <LogIn className='h-4 w-4 mr-2' />
                Go to Login
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push('/en')}
                className='flex-1'
              >
                Go Home
              </Button>
            </div>

            {/* Always show retry button for better UX */}
            <div className='text-center'>
              <Button
                variant='ghost'
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  checkAuth(true);
                }}
                className='text-sm'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Retry Authentication
              </Button>
            </div>

            {/* Development mode quick bypass */}
            {process.env.NODE_ENV === 'development' && (
              <div className='border-t pt-4'>
                <div className='text-center text-xs text-gray-500 mb-2'>
                  Development Mode - Emergency Access
                </div>
                <div className='space-y-2'>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => {
                      localStorage.setItem('emergency-bypass', 'true');
                      localStorage.setItem('dev-bypass', 'true');
                      localStorage.setItem('force-bypass', 'true');
                      window.location.reload();
                    }}
                    className='w-full text-xs'
                  >
                    🚨 EMERGENCY BYPASS (IMMEDIATE)
                  </Button>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        localStorage.setItem('emergency-bypass', 'true');
                        window.location.reload();
                      }}
                      className='flex-1 text-xs'
                    >
                      Quick Bypass
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => router.push('/emergency-bypass')}
                      className='flex-1 text-xs'
                    >
                      Test Bypass
                    </Button>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => router.push('/dev-status')}
                    className='w-full text-xs'
                  >
                    🔧 Development Status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required role, render children
  return <>{children}</>;
}
