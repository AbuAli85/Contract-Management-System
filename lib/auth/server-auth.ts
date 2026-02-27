/**
 * Server-side authentication helpers.
 *
 * These functions are for use in Server Components, Route Handlers,
 * and Server Actions only. They use getUser() (not getSession()) for
 * secure server-side validation.
 *
 * KEY PRINCIPLE:
 *   - getUser() validates the JWT against the Supabase Auth server
 *   - getSession() only reads the local cookie (NOT validated server-side)
 *   - Always use getUser() on the server for security-sensitive operations
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  user: User;
  session: Session | null;
}

/**
 * Get the currently authenticated user.
 * Returns null if not authenticated (does NOT redirect).
 *
 * Uses getUser() for secure server-side validation.
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current session.
 * Returns null if not authenticated.
 *
 * NOTE: For security-sensitive operations, use getServerUser() instead.
 * getSession() is acceptable for reading non-sensitive session metadata.
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Require authentication for a Server Component or Route Handler.
 * Redirects to login if not authenticated, preserving the returnTo URL.
 *
 * @param locale - The locale prefix for the redirect URL
 * @param returnTo - The URL to redirect back to after login
 */
export async function requireServerAuth(
  locale = 'en',
  returnTo?: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = returnTo
      ? `/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : `/${locale}/auth/login`;
    redirect(loginUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user, session };
}

/**
 * Require a specific role for a Server Component or Route Handler.
 * Redirects to unauthorized page if the role check fails.
 */
export async function requireRole(
  allowedRoles: string[],
  locale = 'en',
  returnTo?: string
): Promise<AuthResult> {
  const auth = await requireServerAuth(locale, returnTo);

  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', auth.user.id)
    .single();

  const role = userProfile?.role ?? auth.user.user_metadata?.role;

  if (!role || !allowedRoles.includes(role)) {
    redirect(`/${locale}/auth/unauthorized`);
  }

  if (userProfile?.status && userProfile.status !== 'active') {
    redirect(`/${locale}/auth/pending-approval`);
  }

  return auth;
}
