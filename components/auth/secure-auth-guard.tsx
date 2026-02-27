'use client';

/**
 * SecureAuthGuard — Route protection component.
 *
 * IMPROVEMENTS over auth-guard.tsx:
 * - Uses the new AuthContext (real Supabase session sync)
 * - No global state pollution
 * - Proper loading skeleton instead of blank screen
 * - Preserves returnTo URL for post-login redirect
 * - Role-based access control
 * - Email confirmation check
 */

import React, { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuthContext } from './auth-context';

interface SecureAuthGuardProps {
  children: React.ReactNode;
  /** If true, redirect to login when not authenticated. Default: true */
  requireAuth?: boolean;
  /** If provided, only users with these roles can access the page */
  allowedRoles?: string[];
  /** If true, require email to be confirmed */
  requireEmailConfirmed?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ReactNode;
}

function DefaultLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Verifying your session...</p>
      </div>
    </div>
  );
}

function DefaultUnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500 text-center max-w-sm p-6">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-slate-800">Access Denied</h2>
        <p className="text-sm">
          You do not have permission to access this page. Please contact your administrator if you
          believe this is an error.
        </p>
      </div>
    </div>
  );
}

export function SecureAuthGuard({
  children,
  requireAuth = true,
  allowedRoles = [],
  requireEmailConfirmed = false,
  loadingComponent,
  unauthorizedComponent,
}: SecureAuthGuardProps) {
  const auth = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    if (auth.isLoading) return;

    if (requireAuth && !auth.isAuthenticated) {
      // Preserve the current URL so we can redirect back after login
      const returnTo = encodeURIComponent(pathname ?? '/');
      router.replace(`/${locale}/auth/login?returnTo=${returnTo}`);
      return;
    }

    if (auth.isAuthenticated && requireEmailConfirmed && !auth.isEmailConfirmed) {
      router.replace(`/${locale}/auth/pending-approval?reason=email_unconfirmed`);
      return;
    }

    if (
      auth.isAuthenticated &&
      allowedRoles.length > 0 &&
      auth.role &&
      !allowedRoles.includes(auth.role)
    ) {
      router.replace(`/${locale}/auth/unauthorized`);
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.isEmailConfirmed,
    auth.role,
    requireAuth,
    requireEmailConfirmed,
    allowedRoles,
    router,
    locale,
    pathname,
  ]);

  // Show loading while checking auth
  if (auth.isLoading) {
    return <>{loadingComponent ?? <DefaultLoadingScreen />}</>;
  }

  // Show unauthorized if not authenticated and auth is required
  if (requireAuth && !auth.isAuthenticated) {
    return <>{loadingComponent ?? <DefaultLoadingScreen />}</>;
  }

  // Show unauthorized if role check fails
  if (
    auth.isAuthenticated &&
    allowedRoles.length > 0 &&
    auth.role &&
    !allowedRoles.includes(auth.role)
  ) {
    return <>{unauthorizedComponent ?? <DefaultUnauthorizedScreen />}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of SecureAuthGuard.
 * Wraps a page component with authentication protection.
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<SecureAuthGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SecureAuthGuard {...options}>
      <Component {...props} />
    </SecureAuthGuard>
  );
  WrappedComponent.displayName = `withAuth(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
}
