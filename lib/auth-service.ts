// 🔄 HYBRID AUTH SERVICE - Safe during SSR, functional on client
// Enhanced error handling for better user experience
// Converts raw Supabase errors to user-friendly messages
import { useEffect, useState } from 'react';
import { useAuth as useAuthFromProviders } from '@/app/providers';

export function useAuth() {
  const authData = useAuthFromProviders();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return safe values during SSR, real auth on client
  // Note: All hooks must be called before any conditional returns
  if (!isClient) {
    return {
      user: null,
      session: null,
      loading: false,
      mounted: false,
      signIn: () => Promise.resolve({ user: null, session: null }),
      signOut: () => Promise.resolve(),
      signUp: () => Promise.resolve({ user: null, session: null }),
    };
  }

  return {
    user: authData.user,
    session: authData.session,
    loading: authData.loading,
    mounted: isClient,
    signIn: async (email: string, password: string) => {
      if (!authData.authData.supabase)
        return { success: false, error: 'Authentication service unavailable' };

      try {
        const { data, error } = await authData.authData.supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Format the error message for better user experience
          let formattedError = 'Authentication failed';

          if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
              formattedError = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
              formattedError =
                'Please check your email and confirm your account before signing in.';
            } else if (error.message.includes('Too many requests')) {
              formattedError =
                'Too many login attempts. Please wait a few minutes before trying again.';
            } else if (error.message.includes('User not found')) {
              formattedError = 'No account found with this email address.';
            } else {
              formattedError = error.message;
            }
          }

          return { success: false, error: formattedError };
        }

        if (!data.user) {
          return { success: false, error: 'Authentication failed' };
        }

        // Check user status if needed
        try {
          const { data: userData, error: userError } = await authData.supabase
            .from('users')
            .select('status, role')
            .eq('id', data.user.id)
            .single();

          if (!userError && userData) {
            if (userData.status === 'pending') {
              return {
                success: false,
                error:
                  'Your account is pending approval. Please contact an administrator.',
                status: 'pending',
              };
            }

            if (userData.status === 'inactive') {
              return {
                success: false,
                error:
                  'Your account has been deactivated. Please contact an administrator.',
                status: 'inactive',
              };
            }
          }
        } catch (statusError) {
          console.error('Error checking user status:', statusError);
          // Continue with login if status check fails
        }

        return { success: true, user: data.user, session: data.session };
      } catch (error) {
        // Handle unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        return { success: false, error: errorMessage };
      }
    },
    signOut: async () => {
      if (!authData.supabase) return;
      const { error } = await authData.supabase.auth.signOut();
      if (error) throw error;
    },
    signUp: async (email: string, password: string, metadata?: any) => {
      if (!authData.supabase) return { user: null, session: null };
      const { data, error } = await authData.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    },
    signInWithProvider: async (provider: 'github' | 'google') => {
      if (!authData.supabase)
        return { success: false, error: 'Authentication service unavailable' };

      try {
        const { data, error } = await authData.supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'OAuth sign-in failed';
        return { success: false, error: errorMessage };
      }
    },
  };
}

export const authService = {
  signIn: async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return { user: null, session: null };
    }

    const { createClient } = await import('@authData.supabase/authData.supabase-js');
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase credentials not configured');
    }

    const authData.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const { data, error } = await authData.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Format the error message for better user experience
        let formattedError = 'Authentication failed';

        if (error.message) {
          if (error.message.includes('Invalid login credentials')) {
            formattedError = 'Invalid email or password. Please try again.';
          } else if (error.message.includes('Email not confirmed')) {
            formattedError =
              'Please check your email and confirm your account before signing in.';
          } else if (error.message.includes('Too many requests')) {
            formattedError =
              'Too many login attempts. Please wait a few minutes before trying again.';
          } else if (error.message.includes('User not found')) {
            formattedError = 'No account found with this email address.';
          } else {
            formattedError = error.message;
          }
        }

        throw new Error(formattedError);
      }

      return data;
    } catch (error) {
      // Re-throw the error with proper formatting
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  },

  signOut: async () => {
    if (typeof window === 'undefined') return;

    const { createClient } = await import('@authData.supabase/authData.supabase-js');
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const authData.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await authData.supabase.auth.signOut();
    if (error) throw error;
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    if (typeof window === 'undefined') {
      return { user: null, session: null };
    }

    const { createClient } = await import('@authData.supabase/authData.supabase-js');
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase credentials not configured');
    }

    const authData.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await authData.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  getCurrentUser: async () => {
    if (typeof window === 'undefined') return null;

    const { createClient } = await import('@authData.supabase/authData.supabase-js');
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    const authData.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const {
      data: { user },
      error,
    } = await authData.supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getSession: async () => {
    if (typeof window === 'undefined') return null;

    const { createClient } = await import('@authData.supabase/authData.supabase-js');
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    const authData.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const {
      data: { session },
      error,
    } = await authData.supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};
