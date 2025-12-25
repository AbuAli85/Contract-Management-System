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
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: CookieOptions }) =>
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

// Admin client that bypasses RLS using service role key
export function createAdminClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase admin credentials');
    }

    // Verify service role key format
    if (!supabaseServiceKey.startsWith('eyJ')) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT token');
    }

    // Extract project reference from URL to verify key matches
    const urlProjectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    // Decode JWT to verify it matches the project (basic validation)
    try {
      const jwtParts = supabaseServiceKey.split('.');
      if (jwtParts.length === 3) {
        // JWT uses base64url encoding, need to convert to base64
        let base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        // Decode the payload (second part of JWT)
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        const keyProjectRef = payload.ref;
        
        if (keyProjectRef && urlProjectRef && keyProjectRef !== urlProjectRef) {
          console.error('❌ SUPABASE_SERVICE_ROLE_KEY project mismatch:', {
            urlProjectRef,
            keyProjectRef,
            supabaseUrl,
            message: 'The service role key is for a different Supabase project. Please use the service_role key from the project matching your NEXT_PUBLIC_SUPABASE_URL.',
          });
          throw new Error(`Service role key project mismatch: URL project is "${urlProjectRef}" but key is for "${keyProjectRef}". Please use the correct service_role key from your Supabase project.`);
        }
        
        if (keyProjectRef && urlProjectRef && keyProjectRef === urlProjectRef) {
          console.log('✅ Service role key project matches URL:', keyProjectRef);
        }
      }
    } catch (jwtError) {
      // If JWT decoding fails, log but don't fail - might still work
      console.warn('⚠️ Could not decode service role key JWT for validation:', (jwtError as Error).message);
    }

    // Use ES6 import for better Next.js compatibility
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      },
    });

    return adminClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[createAdminClient] Failed to create admin client:', {
      error: errorMessage,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    throw error;
  }
}
