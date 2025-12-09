/**
 * Secure Cookie Configuration for Supabase Client
 *
 * This file provides enhanced cookie security for the Supabase authentication system.
 * Implements Secure, HttpOnly, and SameSite flags to prevent XSS and CSRF attacks.
 *
 * Usage: Replace the existing createClient function in lib/supabase/server.ts
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              // ✅ Force secure cookie settings
              secure: true, // Only transmit over HTTPS
              httpOnly: true, // Prevent JavaScript access
              sameSite: 'strict', // Prevent CSRF attacks
              path: '/', // Available across entire site
            });
          } catch (error) {
            // Handle cookie setting errors gracefully
            console.error('Cookie setting error:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              secure: true,
              httpOnly: true,
              sameSite: 'strict',
            });
          } catch (error) {
            console.error('Cookie removal error:', error);
          }
        },
      },
    }
  );
}
