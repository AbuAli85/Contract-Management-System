'use client';

/**
 * AuthContext — Unified authentication context for the application.
 *
 * FIXES:
 * - Replaces the broken auth-provider.tsx that never synced with Supabase
 * - Uses onAuthStateChange to reactively update the user state
 * - Properly handles loading states and session expiry
 * - Provides role-based helpers
 * - Preserves returnTo URL for post-login redirects
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  phone: string | null;
  avatar_url: string | null;
  email_confirmed: boolean;
}

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailConfirmed: boolean;
  role: string | null;
  isAdmin: boolean;
  isProvider: boolean;
  isClient: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Auth Provider ────────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/pending-approval',
  '/auth/unauthorized',
  '/forgot-password',
  '/reset-password',
  '/login',
  '/register',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.includes(p));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileFetchRef = useRef<AbortController | null>(null);

  // ── Fetch user profile from DB ──────────────────────────────────────────────
  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!supabase) return null;

      // Cancel any in-flight profile fetch
      profileFetchRef.current?.abort();
      profileFetchRef.current = new AbortController();

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status, phone, avatar_url')
          .eq('id', userId)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          email: data.email,
          full_name: data.full_name ?? null,
          role: data.role ?? 'user',
          status: data.status ?? 'active',
          phone: data.phone ?? null,
          avatar_url: data.avatar_url ?? null,
          email_confirmed: true, // If they're in the DB they've been confirmed
        };
      } catch {
        return null;
      }
    },
    [supabase]
  );

  // ── Public refresh function ─────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user, fetchProfile]);

  // ── Sign out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback: sign out directly via Supabase client
      await supabase?.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    router.push(`/${locale}/auth/login`);
  }, [supabase, router, locale]);

  // ── Initialize auth state ───────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { user: initialUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (initialUser) {
          const {
            data: { session: initialSession },
          } = await supabase.auth.getSession();

          setUser(initialUser);
          setSession(initialSession);

          const p = await fetchProfile(initialUser.id);
          if (mounted) setProfile(p);
        }
      } catch (err) {
        console.error('[AuthContext] Init error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && newSession) {
        setUser(newSession.user);
        setSession(newSession);
        const p = await fetchProfile(newSession.user.id);
        if (mounted) setProfile(p);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setUser(newSession.user);
        setSession(newSession);
      } else if (event === 'USER_UPDATED' && newSession) {
        setUser(newSession.user);
        const p = await fetchProfile(newSession.user.id);
        if (mounted) setProfile(p);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      profileFetchRef.current?.abort();
    };
  }, [supabase, fetchProfile]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const role = profile?.role ?? user?.user_metadata?.role ?? null;
  const isAuthenticated = !!user && !!session;
  const isEmailConfirmed = !!user?.email_confirmed_at;

  const value: AuthContextValue = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isEmailConfirmed,
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isProvider: role === 'provider',
    isClient: role === 'client' || role === 'user',
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * Hook that redirects to login if the user is not authenticated.
 * Preserves the current URL as a `returnTo` parameter.
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const auth = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      const returnTo = encodeURIComponent(pathname ?? '/');
      router.replace(`/${locale}/auth/login?returnTo=${returnTo}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && auth.role) {
      if (!allowedRoles.includes(auth.role)) {
        router.replace(`/${locale}/auth/unauthorized`);
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.role, allowedRoles, router, locale, pathname]);

  return auth;
}
