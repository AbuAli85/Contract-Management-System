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

  // Extract project reference once for reuse
  const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  // Helper function to fix cookie names
  const fixCookieName = (name: string): string => {
    if (!projectRef) return name;
    
    // Fix old format: sb-auth-token.X → sb-{projectRef}-auth-token.X
    if (name.startsWith('sb-auth-token') && !name.includes(projectRef)) {
      return name.replace(/^sb-auth-token/, `sb-${projectRef}-auth-token`);
    }
    
    // Fix other sb- cookies missing project ref
    if (name.startsWith('sb-') && !name.includes(projectRef) && name !== 'sb-auth-token') {
      const parts = name.split('-');
      if (parts.length > 1 && parts[1] !== projectRef) {
        return `sb-${projectRef}-${parts.slice(1).join('-')}`;
      }
    }
    
    return name;
  };
  
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
          
          const cookies = document.cookie.split(';').map(cookie => {
            const trimmedCookie = cookie.trim();
            const firstEqualsIndex = trimmedCookie.indexOf('=');
            if (firstEqualsIndex === -1) {
              return { name: trimmedCookie, value: '' };
            }
            const name = trimmedCookie.substring(0, firstEqualsIndex);
            const value = trimmedCookie.substring(firstEqualsIndex + 1);
            
            // Fix cookie names when reading (for old-format cookies)
            const fixedName = fixCookieName(name);
            
            // If name was fixed, also rename the actual cookie
            if (fixedName !== name && value) {
              try {
                const isProduction = window.location.protocol === 'https:';
                const secureFlag = isProduction ? '; Secure' : '';
                // Set new cookie with correct name
                document.cookie = `${fixedName}=${value}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
                // Delete old cookie
                document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                console.debug(`[SSO] Auto-fixed cookie on read: ${name} → ${fixedName}`);
              } catch (e) {
                console.debug(`[SSO] Could not auto-fix cookie ${name}:`, e);
              }
            }
            
            return { name: fixedName, value };
          });
          
          return cookies;
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
              // Fix cookie names if they're missing the project reference
              const cookieName = fixCookieName(name);
              if (cookieName !== name) {
                console.debug(`[SSO] Fixed cookie name on set: ${name} → ${cookieName}`);
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
      
      // CRITICAL: Force session initialization from localStorage
      // createBrowserClient should do this automatically, but we ensure it happens
      // This reads from localStorage and sets cookies
      supabaseInstance.auth.getSession().then(({ data: { session }, error }) => {
        if (session && !error && session.user) {
          console.log('[SSO] Session initialized from localStorage, cookies should be set');
          
          // Verify cookies were set by checking if we can read them back
          const cookies = document.cookie.split(';').map(c => c.trim());
          const hasAuthCookies = cookies.some(c => 
            c.includes('sb-') && (c.includes('auth-token') || c.includes('auth'))
          );
          
          if (!hasAuthCookies) {
            console.warn('[SSO] Session found but cookies not set. Attempting to set session again...');
            // Force setSession to ensure cookies are created
            supabaseInstance.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }).then(({ error: setError }) => {
              if (setError) {
                console.error('[SSO] Failed to set session in cookies:', setError);
              } else {
                console.log('[SSO] Session forced into cookies');
              }
            });
          }
        } else if (error) {
          console.warn('[SSO] No valid session found in localStorage:', error.message);
        } else {
          console.debug('[SSO] No session found - user needs to log in');
        }
      }).catch((err) => {
        console.debug('[SSO] Error initializing session:', err);
      });
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabaseInstance;
};

// Safely export supabase instance
export const supabase = typeof window !== 'undefined' ? createClient() : null;

// Auto-fix old-format cookies on page load
// Also migrate localStorage session to cookies if needed
if (typeof window !== 'undefined') {
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fixOldFormatCookies();
      migrateLocalStorageToCookies();
    });
  } else {
    // DOM already ready, run immediately
    fixOldFormatCookies();
    migrateLocalStorageToCookies();
  }
}

/**
 * Migrates session from localStorage to cookies if cookies are missing
 * This ensures API routes can read the session
 */
async function migrateLocalStorageToCookies() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;
    
    const supabase = createClient();
    if (!supabase) return;
    
    // Check if we already have a session in cookies
    const { data: { session: cookieSession } } = await supabase.auth.getSession();
    if (cookieSession && cookieSession.user) {
      // Already have session in cookies, no migration needed
      return;
    }
    
    // Check localStorage for session
    const localStorageSession = localStorage.getItem('sb-auth-token');
    if (!localStorageSession) return;
    
    try {
      // Try to parse the localStorage value
      const sessionData = JSON.parse(localStorageSession);
      
      // Check if it's the storage key format (with uuid, version, domain, ts)
      // This is Supabase's internal storage metadata, not the actual session
      if (sessionData.uuid && sessionData.version && sessionData.domain) {
        console.warn('[SSO] Found storage key metadata in localStorage (not actual session data)');
        console.warn('[SSO] This format cannot be used directly. Supabase client should handle this.');
        console.warn('[SSO] If cookies are missing, the session may be expired or corrupted.');
        
        // The createBrowserClient should read from its internal storage automatically
        // But if it's not working, the session might be expired
        // Try one more time to get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user && !error) {
          console.log('[SSO] Session retrieved successfully from Supabase internal storage');
          return;
        } else {
          console.warn('[SSO] Could not retrieve session. The storage key may point to an expired session.');
          console.warn('[SSO] Recommendation: Clear localStorage and log in again.');
          // Optionally clear the invalid storage
          // localStorage.removeItem('sb-auth-token');
          return;
        }
      }
      
      // Check if it has the required session fields (standard Supabase session format)
      if (sessionData.access_token && sessionData.refresh_token) {
        // Set the session in Supabase client, which will sync to cookies
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
        
        if (error) {
          console.error('[SSO] Failed to set session from localStorage:', error);
          console.warn('[SSO] Session may be expired. Please log in again.');
        } else {
          console.log('[SSO] Migrated session from localStorage to cookies');
        }
      } else if (sessionData.user) {
        // Has user but no tokens - might be expired, try to refresh
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (refreshedSession) {
          console.log('[SSO] Refreshed session from localStorage');
        } else {
          console.warn('[SSO] Session in localStorage appears expired. Please log in again.');
        }
      } else {
        console.warn('[SSO] localStorage session format not recognized:', Object.keys(sessionData));
        console.warn('[SSO] Expected: access_token, refresh_token, user OR uuid, version, domain, ts');
      }
    } catch (parseError) {
      console.debug('[SSO] Could not parse localStorage session:', parseError);
    }
  } catch (error) {
    console.debug('[SSO] Error migrating localStorage to cookies:', error);
  }
}

function fixOldFormatCookies() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;
    
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) return;
    
    const allCookies = document.cookie.split(';').map(c => c.trim());
    const oldFormatCookies = ['sb-auth-token.0', 'sb-auth-token.1'];
    const newFormatCookies = [
      `sb-${projectRef}-auth-token.0`,
      `sb-${projectRef}-auth-token.1`
    ];
    
    let fixed = false;
    const cookieMap: Record<string, string> = {};
    
    // Build cookie map
    allCookies.forEach(c => {
      const [name, ...valueParts] = c.split('=');
      const value = valueParts.join('=');
      cookieMap[name] = value;
    });
    
    // Check if old format exists and new format doesn't
    for (let i = 0; i < oldFormatCookies.length; i++) {
      const oldName = oldFormatCookies[i];
      const newName = newFormatCookies[i];
      
      if (cookieMap[oldName] && !cookieMap[newName]) {
        const value = cookieMap[oldName];
        const isProduction = window.location.protocol === 'https:';
        const secureFlag = isProduction ? '; Secure' : '';
        
        // Set new cookie
        document.cookie = `${newName}=${value}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
        // Delete old cookie
        document.cookie = `${oldName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        fixed = true;
        console.debug(`[SSO] Auto-fixed cookie on page load: ${oldName} → ${newName}`);
      }
    }
    
    if (fixed) {
      console.log('[SSO] Fixed old-format cookies on page load');
    }
  } catch (error) {
    console.debug('[SSO] Error fixing old-format cookies:', error);
  }
}
