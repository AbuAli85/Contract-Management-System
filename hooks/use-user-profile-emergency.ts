import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-service';
import { getRoleDisplay as getHierarchyRoleDisplay } from '@/lib/role-hierarchy';
import type { UserProfile } from '@/types/custom';

export interface EnhancedUserProfile extends UserProfile {
  display_name: string;
  initials: string;
  role_display: string;
  last_activity?: string;
  total_activities?: number;
}

// EMERGENCY VERSION - MINIMAL FUNCTIONALITY TO STOP INFINITE LOOPS
export function useUserProfileEmergency() {
  console.log(
    '🚨 EMERGENCY useUserProfile hook loaded - Infinite loop prevention active'
  );
  const { user } = useAuth();
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent initial loading
  const [error, setError] = useState<string | null>(null);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (userProfile: UserProfile | null, authUser: any) => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (authUser?.user_metadata?.full_name) {
      return authUser.user_metadata.full_name;
    }
    return authUser?.email || 'User';
  };

  const getRoleDisplay = (role: string | null | undefined) => {
    if (!role) return 'User';
    const hierarchyDisplay = getHierarchyRoleDisplay(role);
    return hierarchyDisplay.displayText;
  };

  // EMERGENCY: Simplified profile creation without API calls
  useEffect(() => {
    console.log(
      '🚨 Emergency useEffect running - creating fallback profile only'
    );

    if (user && user.id) {
      // Create fallback profile from auth data only - NO API CALLS
      const fallbackProfile: EnhancedUserProfile = {
        id: user.id,
        email: user.email || '',
        display_name: getDisplayName(null, user),
        initials: getInitials(getDisplayName(null, user)),
        role_display: getRoleDisplay(user.user_metadata?.role || 'user'),
        avatar_url: user.user_metadata?.avatar_url || null,
        full_name: user.user_metadata?.full_name || null,
        role: user.user_metadata?.role || 'user',
        created_at: user.created_at || null,
        last_login: user.last_sign_in_at || null,
      };
      setProfile(fallbackProfile);
      setError(null);
      console.log(
        '✅ Emergency profile created from auth data:',
        fallbackProfile
      );
    } else {
      setProfile(null);
      setError('No authenticated user');
      console.log('❌ No user authenticated in emergency mode');
    }
    setLoading(false);
  }, [user?.id]); // ONLY depend on user ID - no function dependencies

  // EMERGENCY: Disable all profile updates and fetching
  const fetchUserProfile = () => {
    console.log(
      '🚨 Emergency mode: Profile fetching disabled to prevent infinite loops'
    );
    return Promise.resolve();
  };

  const updateUserProfile = () => {
    console.log(
      '🚨 Emergency mode: Profile updates disabled to prevent infinite loops'
    );
    return Promise.reject(
      new Error('Profile updates disabled in emergency mode')
    );
  };

  return {
    profile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
    getDisplayName: (userProfile?: UserProfile | null) =>
      getDisplayName(userProfile || null, user),
    getInitials: (fullName?: string) =>
      getInitials(fullName || getDisplayName(null, user)),
    getRoleDisplay: (role?: string | null) => getRoleDisplay(role),
  };
}
