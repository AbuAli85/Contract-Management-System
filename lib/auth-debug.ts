// Authentication Debug Utility
export const authDebug = {
  // Log authentication state
  logAuthState: (user: any, session: any, loading: boolean) => {
    console.log('🔐 Auth Debug - State:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email,
      sessionExpiresAt: session?.expires_at,
      currentTime: Date.now(),
    });
  },

  // Log environment variables (safely)
  logEnvironment: () => {
    console.log('🔐 Auth Debug - Environment:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPreview: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`,
      anonKeyPreview: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`,
      serviceKeyPreview: `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`,
      nodeEnv: process.env.NODE_ENV,
    });
  },

  // Log login attempt
  logLoginAttempt: (email: string) => {
    console.log('🔐 Auth Debug - Login Attempt:', {
      email,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });
  },

  // Log login result
  logLoginResult: (success: boolean, error?: any) => {
    console.log('🔐 Auth Debug - Login Result:', {
      success,
      error: error?.message || error,
      errorCode: error?.code,
      timestamp: new Date().toISOString(),
    });
  },

  // Log Supabase client state
  logSupabaseClient: (client: any) => {
    console.log('🔐 Auth Debug - Supabase Client:', {
      hasClient: !!client,
      hasAuth: !!client?.auth,
      clientType: typeof client,
      timestamp: new Date().toISOString(),
    });
  },

  // Test Supabase connection
  testConnection: async (client: any) => {
    try {
      console.log('🔐 Auth Debug - Testing Supabase connection...');

      if (!client) {
        console.error('❌ No Supabase client available');
        return false;
      }

      // Test basic connection
      const { data, error } = await client
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection test failed:', error.message);
        return false;
      }

      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
      return false;
    }
  },
};
