'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useAuth } from '@/lib/auth-service';
import { useSupabase } from '@/app/providers';

type Role = 'admin' | 'user' | 'manager' | 'reviewer' | 'promoter';

interface RBACContextType {
  userRoles: Role[];
  isLoading: boolean;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAllRoles: (roles: Role[]) => boolean;
  refreshRoles: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user roles from API or default to user role
  const loadUserRoles = useCallback(async () => {

    if (!user) {
      setUserRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      // Method 1: Try direct Supabase client first
      if (!supabase) {
        throw new Error('Failed to get Supabase client from context');
      }


      // First try to find user by email (this handles admin user with fixed UUID)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email || '')
        .single();

      if (!usersError && usersData?.role) {
        setUserRoles([usersData.role as Role]);
        setIsLoading(false);
        return;
      }

      // If not found by email, try by auth ID (for regular users)
      if (usersError) {
        const { data: authIdUser, error: authIdError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!authIdError && authIdUser?.role) {
          setUserRoles([authIdUser.role as Role]);
          setIsLoading(false);
          return;
        }
      }

      // If user not found, try to create them (but only if they don't already exist)
      if (
        usersError &&
        (usersError.message.includes('No rows found') ||
          usersError.message.includes('multiple (or no) rows returned'))
      ) {

        // SECURITY FIX: Standard user creation without hardcoded admin checks
        try {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .upsert(
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                role: user.user_metadata?.role || 'user',
                status: 'active',
                created_at: user.created_at,
              },
              {
                onConflict: 'email', // Use email as conflict key to avoid 409 errors
                ignoreDuplicates: false,
              }
            )
            .select('role')
            .single();

          if (!createError && newUser?.role) {
            setUserRoles([newUser.role as Role]);
            setIsLoading(false);
            return;
          }
        } catch (createError) {
          // Non-fatal: silently handled
        }
      }

      // Check profiles table as fallback
      try {
        // First, try to ensure the user profile exists
        try {
          await supabase.rpc('ensure_user_profile', { user_id: user.id });
        } catch (error) {
          // Non-fatal: silently handled
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id);

        if (
          !profilesError &&
          profilesData &&
          profilesData.length > 0 &&
          profilesData[0]?.role
        ) {
          setUserRoles([profilesData[0].role as Role]);
          setIsLoading(false);
          return;
        } else {
        }
      } catch (error) {
        // Try alternative approach - use the API route
        try {
          const response = await fetch('/api/get-user-role', {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const roleData = await response.json();
            const role = roleData.role?.value ?? roleData.role;
            if (role) {
              setUserRoles([role as Role]);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiError) {
          // Non-fatal: silently handled
        }
      }

      // SECURITY FIX: Remove hardcoded admin email check - use database roles only
      setUserRoles(['user']);
      setIsLoading(false);
    } catch (error) {
      console.error('🔐 RBACProvider: Error loading roles:', error);

      // SECURITY FIX: Remove hardcoded admin fallback - always use default
      setUserRoles(['user']);
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Refresh roles from server
  const refreshRoles = useCallback(async () => {
    setIsLoading(true);
    await loadUserRoles();
  }, [loadUserRoles]);

  // Load roles when user changes
  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  // Helper functions
  const hasRole = useCallback(
    (role: Role) => userRoles.includes(role),
    [userRoles]
  );

  const hasAnyRole = useCallback(
    (roles: Role[]) => roles.some(role => userRoles.includes(role)),
    [userRoles]
  );

  const hasAllRoles = useCallback(
    (roles: Role[]) => roles.every(role => userRoles.includes(role)),
    [userRoles]
  );

  const contextValue: RBACContextType = {
    userRoles,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshRoles,
  };

  return (
    <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>
  );
}
