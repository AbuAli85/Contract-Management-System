/**
 * Canonical company-scoped role resolution utility.
 *
 * All authorization checks in API routes MUST use this module instead of
 * reading `profiles.role` or `users.role`. Those columns are legacy and will
 * be removed in a future migration.
 *
 * The authoritative source of truth is:
 *   user_roles (user_id, company_id, role, is_active)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type CompanyRole = 'admin' | 'manager' | 'provider' | 'client' | 'viewer';

export interface CompanyRoleResult {
  role: CompanyRole | null;
  companyId: string | null;
  profileId: string | null;
}

/**
 * Resolve the current authenticated user's role in the given company.
 *
 * @param supabase  - Server-side Supabase client (from createClient())
 * @param companyId - The company to check the role for. If omitted, uses
 *                    the user's active_company_id from profiles.
 */
export async function getCompanyRole(
  supabase: SupabaseClient,
  companyId?: string | null
): Promise<CompanyRoleResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { role: null, companyId: null, profileId: null };
  }

  // Resolve profile id and active_company_id in one query
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, active_company_id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return { role: null, companyId: null, profileId: null };
  }

  const targetCompanyId = companyId ?? profile.active_company_id;

  if (!targetCompanyId) {
    return { role: null, companyId: null, profileId: profile.id };
  }

  // Look up role in user_roles (the canonical source)
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', profile.id)
    .eq('company_id', targetCompanyId)
    .eq('is_active', true)
    .single();

  if (roleError || !userRole) {
    return { role: null, companyId: targetCompanyId, profileId: profile.id };
  }

  return {
    role: userRole.role as CompanyRole,
    companyId: targetCompanyId,
    profileId: profile.id,
  };
}

/**
 * Returns true if the current user has at least one of the given roles
 * in the specified company.
 */
export async function requireCompanyRole(
  supabase: SupabaseClient,
  allowedRoles: CompanyRole[],
  companyId?: string | null
): Promise<{ authorized: boolean; result: CompanyRoleResult }> {
  const result = await getCompanyRole(supabase, companyId);
  const authorized = result.role !== null && allowedRoles.includes(result.role);
  return { authorized, result };
}

/**
 * Returns true if the current user is an admin or manager in the given company.
 * This is the most common authorization check in the codebase.
 */
export async function isAdminOrManager(
  supabase: SupabaseClient,
  companyId?: string | null
): Promise<boolean> {
  const { authorized } = await requireCompanyRole(
    supabase,
    ['admin', 'manager'],
    companyId
  );
  return authorized;
}

/**
 * Returns true if the current user is an admin in the given company.
 */
export async function isAdmin(
  supabase: SupabaseClient,
  companyId?: string | null
): Promise<boolean> {
  const { authorized } = await requireCompanyRole(supabase, ['admin'], companyId);
  return authorized;
}
