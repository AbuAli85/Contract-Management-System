'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/providers';

interface DashboardAuthGuardProps {
  children: React.ReactNode;
  locale?: string;
  requiredRole?: string | string[];
}

export function DashboardAuthGuard({
  children,
  locale,
  requiredRole,
}: DashboardAuthGuardProps) {
  const { session, loading, supabase } = useSupabase();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0);
  const [lastRoleCheck, setLastRoleCheck] = useState<number>(0);

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check user status when session is available
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!session?.user || checkingStatus || !supabase) return;

      // Debounce status checks to prevent excessive calls
      const now = Date.now();
      if (now - lastStatusCheck < 300000) {
        // 300 second debounce (increased from 120 to match main AuthGuard)
        return;
      }

      setCheckingStatus(true);

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setCheckingStatus(false);
        setUserStatus('active');
      }, 5000); // 5 second timeout

      try {
        // Check user status in both users and profiles tables
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData) {
          setUserStatus(userData.status as string);

          if (userData.status === 'pending') {
            const redirectUrl = locale
              ? `/${locale}/auth/pending-approval`
              : `/auth/pending-approval`;
            router.replace(redirectUrl);
            return;
          }

          if (userData.status === 'inactive') {
            const redirectUrl = locale
              ? `/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`
              : `/auth/login?error=Account deactivated&message=Your account has been deactivated`;
            router.replace(redirectUrl);
            return;
          }
        } else {
          // Try profiles table as fallback
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', session.user.id)
            .single();

          if (!profileError && profileData) {
            setUserStatus(profileData.status as string);

            if (profileData.status === 'pending') {
              const redirectUrl = locale
                ? `/${locale}/auth/pending-approval`
                : `/auth/pending-approval`;
              router.replace(redirectUrl);
              return;
            }

            if (profileData.status === 'inactive') {
              const redirectUrl = locale
                ? `/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`
                : `/auth/login?error=Account deactivated&message=Your account has been deactivated`;
              router.replace(redirectUrl);
              return;
            }
          } else {
            // If user doesn't exist in either table, allow access (new user)
            setUserStatus('active');
          }
        }
      } catch (error) {
        // On error, allow access to prevent blocking
        setUserStatus('active');
      } finally {
        clearTimeout(timeoutId);
        setCheckingStatus(false);
        setLastStatusCheck(Date.now());
      }
    };

    if (mounted && !loading && session && supabase) {
      checkUserStatus();
    }
  }, [
    mounted,
    loading,
    session,
    router,
    locale,
    checkingStatus,
    supabase,
    lastStatusCheck,
  ]);

  // Check user role when required
  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user || checkingRole) return;

      // If no role requirement, allow access
      if (!requiredRole) {
        return;
      }

      // Debounce role checks to prevent excessive calls
      const now = Date.now();
      if (now - lastRoleCheck < 30000) {
        // 30 second debounce (increased from 10)
        return;
      }

      setCheckingRole(true);

      try {
        const response = await fetch('/api/get-user-role');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role.value);

          // Check if user has any of the required roles
          const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.includes(data.role.value)
            : data.role.value === requiredRole;

          // Admin users should have access to everything
          if (data.role.value === 'admin') {
            setUserRole(data.role.value);
            return;
          }

          if (!hasRequiredRole) {
            const requiredRoleDisplay = Array.isArray(requiredRole)
              ? requiredRole.join(' or ')
              : requiredRole;
            const redirectUrl = locale
              ? `/${locale}/auth/unauthorized?required=${requiredRoleDisplay}&current=${data.role.value}`
              : `/auth/unauthorized?required=${requiredRoleDisplay}&current=${data.role.value}`;
            router.replace(redirectUrl);
            return;
          }
        } else {
          const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`;
          router.replace(redirectUrl);
        }
      } catch (error) {
        const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`;
        router.replace(redirectUrl);
      } finally {
        setCheckingRole(false);
        setLastRoleCheck(Date.now());
      }
    };

    if (mounted && !loading && session && requiredRole) {
      checkUserRole();
    }
  }, [
    mounted,
    loading,
    session,
    router,
    locale,
    requiredRole,
    checkingRole,
    lastRoleCheck,
  ]);

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !loading && !session) {
      const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`;
      router.replace(redirectUrl);
    }
  }, [mounted, loading, session, router, locale]);

  // Show loading while mounting, checking status, or if no session
  if (!mounted || loading || !session || checkingStatus || checkingRole) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <p className='text-muted-foreground'>
            {checkingStatus
              ? 'Checking account status...'
              : checkingRole
                ? 'Verifying permissions...'
                : 'Loading authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, status is active, and role is correct (if required), render the dashboard content
  return <>{children}</>;
}
