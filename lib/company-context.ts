import { createClient } from '@/lib/supabase/server';

export interface CompanyContext {
  userId: string;
  companyId: string | null;
  companyRole: string | null;
  isAdmin: boolean;
}

/**
 * Get the current user's company context from their profile
 * Use this in API routes to scope data to the active company
 */
export async function getCompanyContext(): Promise<CompanyContext | null> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return {
        userId: user.id,
        companyId: null,
        companyRole: null,
        isAdmin: false,
      };
    }

    // Get user's role in this company
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const role = membership?.role || null;
    const isAdmin = ['owner', 'admin'].includes(role || '');

    return {
      userId: user.id,
      companyId: profile.active_company_id,
      companyRole: role,
      isAdmin,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Require company context - throws if not available
 */
export async function requireCompanyContext(): Promise<CompanyContext> {
  const context = await getCompanyContext();

  if (!context) {
    throw new Error('Unauthorized');
  }

  if (!context.companyId) {
    throw new Error('No active company selected');
  }

  return context;
}

/**
 * Check if user has specific role in their company
 */
export function hasRole(context: CompanyContext, roles: string[]): boolean {
  if (!context.companyRole) return false;
  return roles.includes(context.companyRole);
}

/**
 * Require specific roles
 */
export function requireRole(context: CompanyContext, roles: string[]): void {
  if (!hasRole(context, roles)) {
    throw new Error(`Access denied. Required roles: ${roles.join(', ')}`);
  }
}
