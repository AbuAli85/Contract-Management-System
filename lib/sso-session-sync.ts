/**
 * SSO Session Sync Utility
 *
 * This utility syncs the existing userSession to sb-auth-token
 * to enable Single Sign-On across platforms.
 *
 * The app currently stores sessions in 'userSession' but SSO requires 'sb-auth-token'
 */

'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Sets a cookie for Supabase session
 */
function setSupabaseCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;

  const isProduction = window.location.protocol === 'https:';
  const secureFlag = isProduction ? '; Secure' : '';
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}${secureFlag}; SameSite=Lax`;
}

/**
 * Syncs userSession to sb-auth-token for SSO compatibility
 * Also sets cookies so API routes can read the session
 * Call this after login or on app initialization
 *
 * IMPORTANT: This function first checks for session in Supabase client (cookies),
 * then falls back to localStorage. This ensures server-side logins work correctly.
 */
export async function syncSessionToSSO() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const supabase = createClient();
    let supabaseSession = null;

    // STEP 1: First, try to get session from Supabase client (reads from cookies)
    // This is critical for server-side logins where session is only in cookies
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!sessionError && session && session.user) {
        supabaseSession = session;
      }
    } catch (getSessionError) {
      console.warn(
        'Could not get session from Supabase client:',
        getSessionError
      );
    }

    // STEP 2: If no session from cookies, check localStorage
    if (!supabaseSession) {
      // Check both userSession and sb-auth-token
      const userSession = localStorage.getItem('userSession');
      const sbAuthToken = localStorage.getItem('sb-auth-token');

      // Try userSession first
      let sessionData = null;
      if (userSession) {
        try {
          sessionData = JSON.parse(userSession);
        } catch (e) {
          console.warn('Could not parse userSession:', e);
        }
      }

      // If no userSession or it's invalid, try sb-auth-token
      if (!sessionData && sbAuthToken) {
        try {
          sessionData = JSON.parse(sbAuthToken);

          // Check if it's the storage key format (uuid, version, domain, ts)
          // This is Supabase's internal storage format - we can't use it directly
          if (sessionData.uuid && sessionData.version && sessionData.domain) {
            console.warn(
              '⚠️  Found storage key format in sb-auth-token. This format cannot be used directly.'
            );
            console.warn(
              '⚠️  The Supabase client should handle this automatically. If cookies are missing, the session may be expired.'
            );
            // Don't try to use this format - let Supabase handle it
            sessionData = null;
          }
        } catch (e) {
          console.warn('Could not parse sb-auth-token:', e);
        }
      }

      if (
        sessionData &&
        (sessionData.user || sessionData.access_token || sessionData.session)
      ) {
        // Extract the actual session object
        if (sessionData.session) {
          supabaseSession = sessionData.session;
        } else if (sessionData.access_token) {
          // If it has access_token directly, wrap it in session format
          supabaseSession = {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
            expires_at: sessionData.expires_at,
            expires_in: sessionData.expires_in,
            token_type: sessionData.token_type || 'bearer',
            user: sessionData.user,
          };
        } else {
          supabaseSession = sessionData;
        }
      }
    }

    // STEP 3: If we have a session, sync it to both localStorage and cookies
    if (
      supabaseSession &&
      (supabaseSession.user || supabaseSession.access_token)
    ) {
      // Sync to userSession (for app compatibility)
      localStorage.setItem('userSession', JSON.stringify(supabaseSession));

      // Sync to sb-auth-token for SSO (localStorage)
      localStorage.setItem('sb-auth-token', JSON.stringify(supabaseSession));

      // CRITICAL: Use Supabase client to set session properly
      // This ensures cookies are set in the correct format for API routes
      if (supabaseSession.access_token) {
        try {
          // Use Supabase's setSession to properly set cookies
          // setSession requires both access_token and refresh_token
          if (supabaseSession.refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token: supabaseSession.access_token,
              refresh_token: supabaseSession.refresh_token,
            });

            if (error) {
              console.error('Error setting session:', error);
              // If setSession fails, the session might be expired
              // Try to refresh it
              try {
                const { data: refreshData, error: refreshError } =
                  await supabase.auth.refreshSession();
                if (refreshError) {
                  console.warn(
                    '⚠️  Session refresh failed. User may need to log in again:',
                    refreshError
                  );
                } else if (refreshData.session) {
                }
              } catch (refreshErr) {
                console.warn('⚠️  Could not refresh session:', refreshErr);
              }
            } else {
              // Verify cookies were set by checking session again
              const {
                data: { session: verifySession },
              } = await supabase.auth.getSession();
              if (verifySession && verifySession.user) {
              } else {
                console.warn(
                  '⚠️  Session set but not found in cookies. This may cause API route issues.'
                );
              }
            }
          } else {
            console.warn(
              '⚠️  No refresh_token available, cookies may not be set correctly'
            );
            // Try to get session from Supabase which might have refresh_token
            const {
              data: { session: existingSession },
            } = await supabase.auth.getSession();
            if (existingSession && existingSession.refresh_token) {
              const { error: setError } = await supabase.auth.setSession({
                access_token: supabaseSession.access_token,
                refresh_token: existingSession.refresh_token,
              });
              if (!setError) {
              } else {
                console.error(
                  'Error setting session with existing refresh_token:',
                  setError
                );
              }
            } else {
              console.warn(
                '⚠️  No refresh_token found. Session may be expired. User should log in again.'
              );
            }
          }
        } catch (supabaseError) {
          console.warn(
            'Could not set session in Supabase client:',
            supabaseError
          );
          // Fallback: manually set cookies (may not work for API routes)
          const sessionString = JSON.stringify(supabaseSession);
          const projectRef =
            process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
              /https?:\/\/([^.]+)\.supabase\.co/
            )?.[1] || 'default';
          setSupabaseCookie(`sb-${projectRef}-auth-token`, sessionString);
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error syncing session to SSO:', error);
    return false;
  }
}

/**
 * Syncs sb-auth-token to userSession for app compatibility
 * Call this when session is updated from SSO
 */
export function syncSSOToSession() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get the SSO session
    const ssoSession = localStorage.getItem('sb-auth-token');

    if (ssoSession) {
      // Parse the session data
      let sessionData;
      try {
        sessionData = JSON.parse(ssoSession);
      } catch (e) {
        console.warn('Could not parse sb-auth-token:', e);
        return;
      }

      // Check if it's a valid session
      if (sessionData && (sessionData.user || sessionData.access_token)) {
        // Sync to userSession for app compatibility
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        return true;
      }
    }
  } catch (error) {
    console.error('Error syncing SSO to session:', error);
  }

  return false;
}

/**
 * Bidirectional sync - keeps both sessions in sync
 * Call this periodically or on session changes
 */
export async function syncSessions() {
  const userSession = localStorage.getItem('userSession');
  const ssoSession = localStorage.getItem('sb-auth-token');

  // If userSession exists but sb-auth-token doesn't, sync to SSO
  if (userSession && !ssoSession) {
    return await syncSessionToSSO();
  }

  // If sb-auth-token exists but userSession doesn't, sync to app
  if (ssoSession && !userSession) {
    return syncSSOToSession();
  }

  // If both exist, check which is newer and sync accordingly
  if (userSession && ssoSession) {
    try {
      const userData = JSON.parse(userSession);
      const ssoData = JSON.parse(ssoSession);

      // Compare timestamps if available, otherwise sync both ways
      const userTime = userData.updated_at || userData.created_at || 0;
      const ssoTime = ssoData.updated_at || ssoData.created_at || 0;

      if (userTime > ssoTime) {
        await syncSessionToSSO();
      } else if (ssoTime > userTime) {
        syncSSOToSession();
      } else {
        // Same time or no timestamp, sync both ways
        await syncSessionToSSO();
        syncSSOToSession();
      }
    } catch (e) {
      // If parsing fails, sync both ways
      await syncSessionToSSO();
      syncSSOToSession();
    }
  }

  return false;
}

/**
 * Initialize session sync - call this on app startup
 */
export function initializeSSOSync() {
  if (typeof window === 'undefined') {
    return;
  }

  // Initial sync
  syncSessions().catch(console.error);

  // Set up periodic sync (every 2 seconds)
  const syncInterval = setInterval(() => {
    syncSessions().catch(console.error);
  }, 2000);

  // Also sync on storage events (cross-tab sync)
  window.addEventListener('storage', e => {
    if (e.key === 'userSession' || e.key === 'sb-auth-token') {
      syncSessions().catch(console.error);
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(syncInterval);
  });

  return () => {
    clearInterval(syncInterval);
  };
}
