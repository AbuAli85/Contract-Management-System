'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

const createSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

export async function getAuthCookie(name: string): Promise<string> {
  const supabase = await createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

export async function setAuthCookie(
  name: string,
  value: string
): Promise<void> {
  // Get the project ID from the Supabase URL
  const projectId =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/(?<=db\.)[^.]+/)?.[0];
  if (!projectId) {
    throw new Error('Could not extract project ID from Supabase URL');
  }

  const cookieStore = await cookies();
  const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years

  // Set the auth token cookie with proper options
  await cookieStore.set({
    name: `sb-${projectId}-auth-token`,
    value,
    maxAge,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteAuthCookie(name: string): Promise<void> {
  const cookieStore = await cookies();
  await cookieStore.delete(name);

  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
}
