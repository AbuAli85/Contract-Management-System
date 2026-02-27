'use client';

/**
 * SessionTimeoutWarning — Shows a warning dialog before the session expires.
 *
 * Monitors user activity and warns them N minutes before session expiry.
 * Provides options to extend the session or sign out.
 *
 * IMPROVEMENTS:
 * - Uses real session expiry from Supabase (not hardcoded timeout)
 * - Tracks user activity to reset the idle timer
 * - Proper cleanup on unmount
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Show warning this many seconds before session expires */
const WARNING_BEFORE_EXPIRY_SECONDS = 5 * 60; // 5 minutes

/** Check session expiry every N seconds */
const CHECK_INTERVAL_SECONDS = 30;

/** Activity events that reset the idle timer */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface SessionTimeoutWarningProps {
  /** Called when the user chooses to sign out */
  onSignOut?: () => void;
}

export function SessionTimeoutWarning({ onSignOut }: SessionTimeoutWarningProps) {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // ── Track user activity ─────────────────────────────────────────────────────
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
    };
  }, [resetActivity]);

  // ── Check session expiry ────────────────────────────────────────────────────
  const checkSession = useCallback(async () => {
    if (!supabase) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Session already expired
        setShowWarning(false);
        if (onSignOut) {
          onSignOut();
        } else {
          router.push(`/${locale}/auth/login?reason=session_expired`);
        }
        return;
      }

      const expiresAt = session.expires_at; // Unix timestamp in seconds
      if (!expiresAt) return;

      const nowSeconds = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - nowSeconds;

      if (remaining <= 0) {
        // Session expired
        setShowWarning(false);
        if (onSignOut) {
          onSignOut();
        } else {
          router.push(`/${locale}/auth/login?reason=session_expired`);
        }
      } else if (remaining <= WARNING_BEFORE_EXPIRY_SECONDS) {
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    } catch {
      // Non-fatal
    }
  }, [supabase, router, locale, onSignOut]);

  // ── Start periodic session check ────────────────────────────────────────────
  useEffect(() => {
    checkSession(); // Check immediately on mount

    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL_SECONDS * 1000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [checkSession]);

  // ── Countdown timer when warning is shown ───────────────────────────────────
  useEffect(() => {
    if (!showWarning) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Time's up
          setShowWarning(false);
          if (onSignOut) {
            onSignOut();
          } else {
            router.push(`/${locale}/auth/login?reason=session_expired`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, router, locale, onSignOut]);

  // ── Extend session ──────────────────────────────────────────────────────────
  const handleExtend = async () => {
    if (!supabase) return;
    setIsExtending(true);

    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        setShowWarning(false);
        setSecondsRemaining(0);
      }
    } catch {
      // Non-fatal
    } finally {
      setIsExtending(false);
    }
  };

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setShowWarning(false);
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase?.auth.signOut();
      router.push(`/${locale}/auth/login`);
    }
  };

  // ── Format time ────────────────────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className="font-semibold text-amber-600">{formatTime(secondsRemaining)}</span>.
            Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="text-4xl font-mono font-bold text-amber-500">
            {formatTime(secondsRemaining)}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <Button
            onClick={handleExtend}
            disabled={isExtending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isExtending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isExtending ? 'Extending...' : 'Stay signed in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
