'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Supabase Client Configuration (SSR)
 * 
 * IMPORTANT for Single Sign-On (SSO):
 * - This client uses cookies for SSR compatibility, but also syncs to localStorage
 * - storageKey must match other platforms (BusinessHub, Contract-Management-System, business-services-hub)
 * - All platforms must use same Supabase project (same URL and anon key)
 * - This allows one login to work across all platforms
 * 
 * The localStorage sync in cookie handlers ensures SSO works even with SSR
 */

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

// Lazy initialization function to avoid build-time errors
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Only run in browser environment
        if (typeof window === 'undefined') {
          return [];
        }
        try {
          if (!document || !document.cookie) {
            return [];
          }
          return document.cookie.split(';').map(cookie => {
            const trimmedCookie = cookie.trim();
            const firstEqualsIndex = trimmedCookie.indexOf('=');
            if (firstEqualsIndex === -1) {
              return { name: trimmedCookie, value: '' };
            }
            const name = trimmedCookie.substring(0, firstEqualsIndex);
            const value = trimmedCookie.substring(firstEqualsIndex + 1);
            return { name, value };
          });
        } catch (error) {
          console.error('Error parsing cookies:', error);
          return [];
        }
      },
      setAll(cookiesToSet: Array<{ name: string; value: string }>) {
        // Only run in browser environment
        if (typeof window === 'undefined') {
          return;
        }
        try {
          if (!document) {
            return;
          }
          
          // Extract project reference from Supabase URL to ensure correct cookie names
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
          
          cookiesToSet.forEach(({ name, value }) => {
            try {
              // Fix cookie names if they're missing the project reference
              let cookieName = name;
              if (projectRef && name.startsWith('sb-auth-token')) {
                // Replace 'sb-auth-token.X' with 'sb-{projectRef}-auth-token.X'
                cookieName = name.replace(/^sb-auth-token/, `sb-${projectRef}-auth-token`);
                if (cookieName !== name) {
                  console.debug(`[SSO] Fixed cookie name: ${name} → ${cookieName}`);
                }
              }
              
              // Build cookie string with proper flags
              const isProduction = window.location.protocol === 'https:';
              const secureFlag = isProduction ? '; Secure' : '';
              document.cookie = `${cookieName}=${value}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
              
              // CRITICAL: Also sync to localStorage for SSO across platforms
              // This allows login on one platform to work on all platforms
              // Supabase SSR uses cookies, but we sync to localStorage for cross-platform SSO
              if (cookieName.includes('auth-token') || cookieName.includes('sb-') || cookieName.includes('supabase')) {
                try {
                  const storageKey = 'sb-auth-token';
                  if (value && value.trim()) {
                    // Try to parse as JSON, if it fails, store as-is (might be encoded)
                    try {
                      const decoded = decodeURIComponent(value);
                      const sessionData = JSON.parse(decoded);
                      if (sessionData && typeof sessionData === 'object') {
                        localStorage.setItem(storageKey, JSON.stringify(sessionData));
                      } else {
                        // If not JSON, store the raw value (for token strings)
                        localStorage.setItem(storageKey, value);
                      }
                    } catch {
                      // If parsing fails, store the raw value
                      localStorage.setItem(storageKey, value);
                    }
                  } else {
                    // Clear localStorage when cookie is cleared
                    localStorage.removeItem(storageKey);
                  }
                } catch (storageError) {
                  // Silently fail if localStorage is not available
                  console.debug('Could not sync to localStorage for SSO:', storageError);
                }
              }
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          });
        } catch (error) {
          console.error('Error in setAll cookies:', error);
        }
      },
    },
    // Add auth configuration for SSO
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // CRITICAL: Must match BusinessHub and business-services-hub for SSO
      storageKey: 'sb-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
}

export const createClient = () => {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createSupabaseClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabaseInstance;
};

// Safely export supabase instance
export const supabase = typeof window !== 'undefined' ? createClient() : null;
