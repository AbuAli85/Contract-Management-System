// 🔄 HYBRID USER PROFILE HOOK - Safe during SSR, functional on client
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/app/providers';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  role?: string;
  status?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface EnhancedUserProfile extends UserProfile {
  getDisplayName: () => string;
  getInitials: () => string;
  getRoleDisplay: () => string;
}

export function useUserProfile() {
  const { user, session, supabase } = useSupabase();
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createEnhancedProfile = (profileData: any): EnhancedUserProfile => {
    return {
      ...profileData,
      getDisplayName: () =>
        profileData.display_name ||
        profileData.full_name ||
        profileData.email?.split('@')[0] ||
        'User',
      getInitials: () => {
        const name =
          profileData.display_name ||
          profileData.full_name ||
          profileData.email ||
          'User';
        return name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },
      getRoleDisplay: () => {
        const role = profileData.role || 'user';
        return role.charAt(0).toUpperCase() + role.slice(1);
      },
    };
  };

  useEffect(() => {
    if (!mounted || !user || !supabase) {
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(createEnhancedProfile(data));
        } else {
          // Create a default profile from user data
          const defaultProfile = {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            display_name:
              user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'user',
            status: 'active',
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(createEnhancedProfile(defaultProfile));
        }
      } catch (error) {
        console.warn('Profile fetch failed:', error);
        // Create fallback profile
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          display_name:
            user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: 'user',
          status: 'active',
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(createEnhancedProfile(fallbackProfile));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [mounted, user, supabase]);

  const fetchUserProfile = useCallback(async () => {
    if (!mounted || !user || !supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(createEnhancedProfile(data));
    }
  }, [mounted, user, supabase]);

  const syncUserProfile = useCallback(async () => {
    if (!mounted || !user || !supabase) return;
    await fetchUserProfile();
  }, [mounted, fetchUserProfile]);

  // Return safe defaults during SSR - use mounted state instead of conditional return
  if (!mounted) {
    const safeFallback = createEnhancedProfile({
      id: 'ssr-user',
      email: 'user@example.com',
      full_name: 'User',
      display_name: 'User',
      role: 'user',
      status: 'active',
    });

    return {
      profile: safeFallback,
      loading: false,
      error: null,
      fetchUserProfile: () => Promise.resolve(),
      syncUserProfile: () => Promise.resolve(),
      isProfileSynced: true,
    };
  }

  return {
    profile,
    loading,
    error: null,
    fetchUserProfile,
    syncUserProfile,
    isProfileSynced: !!profile,
  };
}
