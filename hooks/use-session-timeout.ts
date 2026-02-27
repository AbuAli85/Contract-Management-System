import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  enableLogging?: boolean;
  silent?: boolean; // New option to control silent behavior
}

export function useSessionTimeout({
  timeoutMinutes = 30, // 30 minutes is a reasonable default for business apps
  onTimeout,
  enableLogging = false,
  silent = true, // Default to silent mode for security
}: UseSessionTimeoutOptions = {}) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Log function that only logs if logging is enabled
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (enableLogging) {
        console.log('[SessionTimeout]', message, ...args);
      }
    },
    [enableLogging]
  );

  // Perform silent logout
  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current || !user) {
      return;
    }

    isLoggingOutRef.current = true;
    log('Session timeout reached, performing logout');

    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Call custom timeout handler if provided
      if (onTimeout) {
        onTimeout();
      }

      // Sign out the user
      await signOut();

      // Silent redirect to login page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'en';

        log('Redirecting to login page after timeout');
        router.replace('/' + locale + '/auth/login');
      }
    } catch (error) {
      if (enableLogging) {
        console.error('Error during logout:', error);
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [signOut, router, onTimeout, log, user, enableLogging]);

  // Reset the timeout timer
  const resetTimers = useCallback(() => {
    if (!user || isLoggingOutRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    log('Activity detected, resetting timeout timer');

    // Set new timeout for silent logout
    const logoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, logoutTime);
  }, [user, timeoutMinutes, performLogout, log]);

  // Handle user activity - silent version
  const handleActivity = useCallback(() => {
    if (!user || isLoggingOutRef.current) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Only reset if it's been more than 1 second since last activity
    // This prevents excessive timer resets from rapid events
    if (timeSinceLastActivity > 1000) {
      resetTimers();
    }
  }, [user, resetTimers]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      return;
    }

    log('Setting up activity listeners for session timeout');

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur',
    ];

    const handleUserActivity = () => {
      handleActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Cleanup function
    return () => {
      log('Cleaning up activity listeners');

      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, handleActivity, resetTimers, log]);

  // Clean up when user logs out manually
  useEffect(() => {
    if (!user && timeoutRef.current) {
      log('User logged out, clearing timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      isLoggingOutRef.current = false;
    }
  }, [user, log]);

  // Handle page visibility changes for better security
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        log('Page became visible, checking session validity');

        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        const timeoutDuration = timeoutMinutes * 60 * 1000;

        // If the page has been hidden for longer than timeout duration
        if (timeSinceLastActivity > timeoutDuration) {
          log('Page was hidden for too long, performing logout');
          performLogout();
        } else {
          // Reset timeout as user is back
          resetTimers();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, timeoutMinutes, performLogout, resetTimers, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Return functions for manual control
  return {
    resetTimers,
    handleActivity,
    getTimeRemaining: () => {
      const timeElapsed = Date.now() - lastActivityRef.current;
      const timeRemaining = timeoutMinutes * 60 * 1000 - timeElapsed;
      return Math.max(0, Math.floor(timeRemaining / 1000));
    },
    isActive: () => {
      return timeoutRef.current !== null && !isLoggingOutRef.current;
    },
  };
}
