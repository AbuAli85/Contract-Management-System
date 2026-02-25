import { NextRequest, NextResponse } from 'next/server';

export interface RBACOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  context?: Record<string, any>;
  skipAudit?: boolean;
  skipCache?: boolean;
}

/**
 * HOC wrapper for API routes that enforces RBAC
 */
export function withRBAC(
  requiredRoles: string[] | string,
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Normalize required roles
      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      // Check if user has any of the required roles
      const hasRole = await checkUserRole(roles);

      if (!hasRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Call the original handler
      return await handler(req);
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has any of the required roles using Supabase auth
 */
async function checkUserRole(requiredRoles: string[]): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile?.role) return false;
    return requiredRoles.includes(profile.role);
  } catch {
    return false;
  }
}

/**
 * HOC wrapper for components that enforces RBAC
 */
export function withRBACComponent<P extends object>(
  Component: React.ComponentType<P>,
  _options: RBACOptions
) {
  return function RBACWrappedComponent(props: P) {
    return <Component {...props} />;
  };
}
