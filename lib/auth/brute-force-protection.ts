/**
 * Server-side brute-force protection for login attempts.
 *
 * Uses the `failed_login_attempts` table (already in the DB schema) to track
 * and block repeated failed login attempts per email + IP combination.
 *
 * This is MORE SECURE than the previous client-side localStorage approach
 * because it cannot be bypassed by clearing browser storage.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BruteForceCheckResult {
  isBlocked: boolean;
  attemptsRemaining: number;
  blockedUntil: Date | null;
  retryAfterSeconds: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const WINDOW_MINUTES = 15; // Reset attempt count after this period

/**
 * Check if a login attempt should be blocked.
 * Records the failed attempt if `recordFailure` is true.
 */
export async function checkBruteForce(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string
): Promise<BruteForceCheckResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  try {
    // Look up existing record
    const { data: existing } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('ip_address', ipAddress)
      .single();

    if (!existing) {
      // No record — not blocked
      return {
        isBlocked: false,
        attemptsRemaining: MAX_ATTEMPTS,
        blockedUntil: null,
        retryAfterSeconds: 0,
      };
    }

    // Check if currently blocked
    if (existing.blocked_until) {
      const blockedUntil = new Date(existing.blocked_until);
      if (blockedUntil > now) {
        const retryAfterSeconds = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
        return {
          isBlocked: true,
          attemptsRemaining: 0,
          blockedUntil,
          retryAfterSeconds,
        };
      }
    }

    // Check if within the attempt window
    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);
    const lastAttempt = new Date(existing.last_attempt_at);

    if (lastAttempt < windowStart) {
      // Window expired — reset count
      await supabase
        .from('failed_login_attempts')
        .update({
          attempt_count: 0,
          blocked_until: null,
          last_attempt_at: now.toISOString(),
        })
        .eq('email', normalizedEmail)
        .eq('ip_address', ipAddress);

      return {
        isBlocked: false,
        attemptsRemaining: MAX_ATTEMPTS,
        blockedUntil: null,
        retryAfterSeconds: 0,
      };
    }

    const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - existing.attempt_count);

    return {
      isBlocked: false,
      attemptsRemaining,
      blockedUntil: null,
      retryAfterSeconds: 0,
    };
  } catch {
    // On DB error, allow the request (fail open for availability)
    return {
      isBlocked: false,
      attemptsRemaining: MAX_ATTEMPTS,
      blockedUntil: null,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Record a failed login attempt.
 * If the attempt count reaches MAX_ATTEMPTS, lock the account.
 */
export async function recordFailedAttempt(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  try {
    const { data: existing } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('ip_address', ipAddress)
      .single();

    if (!existing) {
      // Create new record
      await supabase.from('failed_login_attempts').insert({
        email: normalizedEmail,
        ip_address: ipAddress,
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString(),
        blocked_until: null,
      });
      return;
    }

    const newCount = (existing.attempt_count ?? 0) + 1;
    const shouldBlock = newCount >= MAX_ATTEMPTS;
    const blockedUntil = shouldBlock
      ? new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString()
      : null;

    await supabase
      .from('failed_login_attempts')
      .update({
        attempt_count: newCount,
        last_attempt_at: now.toISOString(),
        blocked_until: blockedUntil,
      })
      .eq('email', normalizedEmail)
      .eq('ip_address', ipAddress);
  } catch {
    // Non-fatal — don't block the login flow
  }
}

/**
 * Clear failed login attempts on successful login.
 */
export async function clearFailedAttempts(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await supabase
      .from('failed_login_attempts')
      .update({
        attempt_count: 0,
        blocked_until: null,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)
      .eq('ip_address', ipAddress);
  } catch {
    // Non-fatal
  }
}

/**
 * Get the client IP address from a request.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  if (cfIp) return cfIp.trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
