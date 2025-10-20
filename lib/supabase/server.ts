import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// Environment variable validation
const validateEnvironmentVariables = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
};

export async function createClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();
    
    const cookieStore = await cookies();

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    throw new Error('Supabase client initialization failed');
  }
}

export async function createClientWithAuth() {
  try {
    const supabase = await createClient();
    
    // Verify the client is working
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session check failed:', error);
      throw new Error('Authentication service unavailable');
    }
    
    return supabase;
  } catch (error) {
    console.error('Failed to create authenticated Supabase client:', error);
    throw error;
  }
}
