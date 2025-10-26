'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

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
          cookiesToSet.forEach(({ name, value }) => {
            try {
              // Build cookie string with proper flags
              const isProduction = window.location.protocol === 'https:';
              const secureFlag = isProduction ? '; Secure' : '';
              document.cookie = `${name}=${value}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          });
        } catch (error) {
          console.error('Error in setAll cookies:', error);
        }
      },
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
