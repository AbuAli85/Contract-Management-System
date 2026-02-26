'use client';
/**
 * useUserRole — resolves the current user's role from the canonical
 * `user_roles` table (not profiles.role or hardcoded email checks).
 *
 * Returns a rich object so consumers don't need to make additional queries.
 */
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type CompanyRole = 'admin' | 'manager' | 'user' | 'viewer' | 'employer' | 'promoter';

export interface UserRoleState {
  role: CompanyRole | null;
  companyId: string | null;
  profileId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAdminOrManager: boolean;
  refresh: () => void;
}

const EMPTY_STATE = {
  role: null as CompanyRole | null,
  companyId: null as string | null,
  profileId: null as string | null,
  isLoading: false,
  isAdmin: false,
  isManager: false,
  isAdminOrManager: false,
};

/**
 * Primary hook — returns the full role state object.
 * Replaces the old string-only useUserRole.
 */
export function useUserRoleState(): UserRoleState {
  const [state, setState] = useState<typeof EMPTY_STATE>({ ...EMPTY_STATE, isLoading: true });

  const fetchRole = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const supabase = createClient();

      // 1. Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setState({ ...EMPTY_STATE, isLoading: false });
        return;
      }

      // 2. Resolve profile id and active_company_id in one query
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, active_company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setState({ ...EMPTY_STATE, isLoading: false });
        return;
      }

      const targetCompanyId = profile.active_company_id;
      if (!targetCompanyId) {
        setState({ ...EMPTY_STATE, profileId: profile.id, isLoading: false });
        return;
      }

      // 3. Look up role in user_roles — the canonical, company-scoped source
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .eq('company_id', targetCompanyId)
        .eq('is_active', true)
        .single();

      const role = (!roleError && userRole?.role) ? (userRole.role as CompanyRole) : null;

      setState({
        role,
        companyId: targetCompanyId,
        profileId: profile.id,
        isLoading: false,
        isAdmin: role === 'admin',
        isManager: role === 'manager',
        isAdminOrManager: role === 'admin' || role === 'manager',
      });
    } catch {
      setState({ ...EMPTY_STATE, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Re-fetch when auth state changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchRole();
      } else if (event === 'SIGNED_OUT') {
        setState({ ...EMPTY_STATE, isLoading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchRole]);

  return { ...state, refresh: fetchRole };
}

/**
 * Backward-compatible hook that returns just the role string.
 * Existing consumers that do `const role = useUserRole()` continue to work.
 */
export function useUserRole(): CompanyRole | null {
  const { role } = useUserRoleState();
  return role;
}

// Default export for backward compatibility
export default useUserRole;
