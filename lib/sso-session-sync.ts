/**
 * SSO Session Sync Utility
 * 
 * This utility syncs the existing userSession to sb-auth-token
 * to enable Single Sign-On across platforms.
 * 
 * The app currently stores sessions in 'userSession' but SSO requires 'sb-auth-token'
 */

'use client';

/**
 * Syncs userSession to sb-auth-token for SSO compatibility
 * Call this after login or on app initialization
 */
export function syncSessionToSSO() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get the existing userSession
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
      // Parse the session data
      let sessionData;
      try {
        sessionData = JSON.parse(userSession);
      } catch (e) {
        console.warn('Could not parse userSession:', e);
        return;
      }

      // Check if it's a valid session
      if (sessionData && (sessionData.user || sessionData.access_token || sessionData.session)) {
        // Sync to sb-auth-token for SSO
        localStorage.setItem('sb-auth-token', JSON.stringify(sessionData));
        console.log('✅ Session synced to sb-auth-token for SSO');
        
        // Also ensure the session format matches Supabase expectations
        if (sessionData.session) {
          // If it has a session object, use that
          localStorage.setItem('sb-auth-token', JSON.stringify(sessionData.session));
        } else if (sessionData.access_token) {
          // If it has access_token directly, wrap it in session format
          const supabaseSession = {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token || sessionData.session?.refresh_token,
            expires_at: sessionData.expires_at || sessionData.session?.expires_at,
            expires_in: sessionData.expires_in || sessionData.session?.expires_in,
            token_type: sessionData.token_type || 'bearer',
            user: sessionData.user || sessionData.session?.user,
          };
          localStorage.setItem('sb-auth-token', JSON.stringify(supabaseSession));
        }
        
        return true;
      }
    }
  } catch (error) {
    console.error('Error syncing session to SSO:', error);
  }
  
  return false;
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
        console.log('✅ SSO session synced to userSession');
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
export function syncSessions() {
  const userSession = localStorage.getItem('userSession');
  const ssoSession = localStorage.getItem('sb-auth-token');
  
  // If userSession exists but sb-auth-token doesn't, sync to SSO
  if (userSession && !ssoSession) {
    return syncSessionToSSO();
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
        syncSessionToSSO();
      } else if (ssoTime > userTime) {
        syncSSOToSession();
      } else {
        // Same time or no timestamp, sync both ways
        syncSessionToSSO();
        syncSSOToSession();
      }
    } catch (e) {
      // If parsing fails, sync both ways
      syncSessionToSSO();
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
  syncSessions();

  // Set up periodic sync (every 2 seconds)
  const syncInterval = setInterval(() => {
    syncSessions();
  }, 2000);

  // Also sync on storage events (cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === 'userSession' || e.key === 'sb-auth-token') {
      syncSessions();
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

