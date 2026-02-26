/**
 * Shared API route authentication helper.
 *
 * Provides a unified way to authenticate and authorize API routes using the
 * canonical `user_roles` table. Use this in all new API routes and gradually
 * migrate existing routes away from `profiles.role`.
 *
 * Usage:
 *   const auth = await requireAuth(supabase, ['admin', 'manager']);
 *   if (!auth.ok) return auth.response;
 *   // auth.companyId, auth.profileId, auth.role are now available
 */
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getCompanyRole, CompanyRole } from './get-company-role';

export interface AuthResult {
  ok: true;
  role: CompanyRole;
  companyId: string;
  profileId: string;
  userId: string;
}

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

/**
 * Authenticate the current request and optionally enforce role requirements.
 *
 * @param supabase     - Server-side Supabase client
 * @param allowedRoles - If provided, returns 403 if the user's role is not in this list
 * @param companyId    - Optional: override the company to check the role against
 */
export async function requireAuth(
  supabase: SupabaseClient,
  allowedRoles?: CompanyRole[],
  companyId?: string | null
): Promise<AuthResult | AuthFailure> {
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  // Resolve company-scoped role
  const { role, companyId: resolvedCompanyId, profileId } = await getCompanyRole(
    supabase,
    companyId
  );

  if (!role || !resolvedCompanyId || !profileId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No active company membership found' },
        { status: 403 }
      ),
    };
  }

  // Enforce role requirement if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Insufficient permissions',
          required: allowedRoles,
          actual: role,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    role,
    companyId: resolvedCompanyId,
    profileId,
    userId: user.id,
  };
}

/**
 * Convenience: require admin or manager role.
 */
export async function requireAdminOrManager(
  supabase: SupabaseClient,
  companyId?: string | null
): Promise<AuthResult | AuthFailure> {
  return requireAuth(supabase, ['admin', 'manager'], companyId);
}

/**
 * Convenience: require admin role only.
 */
export async function requireAdmin(
  supabase: SupabaseClient,
  companyId?: string | null
): Promise<AuthResult | AuthFailure> {
  return requireAuth(supabase, ['admin'], companyId);
}
