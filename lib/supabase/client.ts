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
  const projectRef = supabaseUrl?.match(
    /https?:\/\/([^.]+)\.supabase\.co/
  )?.[1];

  // Helper function to fix cookie names
  const fixCookieName = (name: string): string => {
    if (!projectRef) return name;

    // Fix old format: sb-auth-token.X → sb-{projectRef}-auth-token.X
    if (name.startsWith('sb-auth-token') && !name.includes(projectRef)) {
      return name.replace(/^sb-auth-token/, `sb-${projectRef}-auth-token`);
    }

    // Fix other sb- cookies missing project ref
    if (
      name.startsWith('sb-') &&
      !name.includes(projectRef) &&
      name !== 'sb-auth-token'
    ) {
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
              } catch (e) {
                // Non-fatal: silently handled
              }
            }

            return { name: fixedName, value };
          });

          return cookies;
        } catch (error) {
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
              }

              // Build cookie string with proper flags
              const isProduction = window.location.protocol === 'https:';
              const secureFlag = isProduction ? '; Secure' : '';
              document.cookie = `${cookieName}=${value}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;

              // CRITICAL: Also sync to localStorage for SSO across platforms
              // This allows login on one platform to work on all platforms
              // Supabase SSR uses cookies, but we sync to localStorage for cross-platform SSO
              if (
                cookieName.includes('auth-token') ||
                cookieName.includes('sb-') ||
                cookieName.includes('supabase')
              ) {
                try {
                  const storageKey = 'sb-auth-token';
                  if (value && value.trim()) {
                    // Try to parse as JSON, if it fails, store as-is (might be encoded)
                    try {
                      const decoded = decodeURIComponent(value);
                      const sessionData = JSON.parse(decoded);
                      if (sessionData && typeof sessionData === 'object') {
                        localStorage.setItem(
                          storageKey,
                          JSON.stringify(sessionData)
                        );
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
                }
              }
            } catch (error) {
              // Non-fatal: silently handled
            }
          });
        } catch (error) {
          // Non-fatal: silently handled
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
      // Check if environment variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return null;
      }

      supabaseInstance = createSupabaseClient();

      // CRITICAL: Force session initialization from localStorage
      // createBrowserClient should do this automatically, but we ensure it happens
      // This reads from localStorage and sets cookies
      supabaseInstance.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          if (session && !error && session.user) {
            // Verify cookies were set by checking if we can read them back
            const cookies = document.cookie.split(';').map(c => c.trim());
            const hasAuthCookies = cookies.some(
              c =>
                c.includes('sb-') &&
                (c.includes('auth-token') || c.includes('auth'))
            );

            if (!hasAuthCookies) {
              // Force setSession to ensure cookies are created
              supabaseInstance.auth
                .setSession({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                })
                .then(({ error: setError }) => {
                  if (setError) {
                  } else {
                  }
                });
            }
          } else if (error) {
          } else {
          }
        })
        .catch(err => {
        });
    } catch (error) {
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
    const {
      data: { session: cookieSession },
    } = await supabase.auth.getSession();
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

        // The createBrowserClient should read from its internal storage automatically
        // But if it's not working, the session might be expired
        // Try one more time to get the session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session && session.user && !error) {
          return;
        } else {
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
        } else {
        }
      } else if (sessionData.user) {
        // Has user but no tokens - might be expired, try to refresh
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.getSession();
        if (refreshedSession) {
        } else {
        }
      } else {
      }
    } catch (parseError) {
      // Non-fatal: silently handled
    }
  } catch (error) {
    // Non-fatal: silently handled
  }
}

function fixOldFormatCookies() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    const projectRef = supabaseUrl.match(
      /https?:\/\/([^.]+)\.supabase\.co/
    )?.[1];
    if (!projectRef) return;

    const allCookies = document.cookie.split(';').map(c => c.trim());
    const oldFormatCookies = ['sb-auth-token.0', 'sb-auth-token.1'];
    const newFormatCookies = [
      `sb-${projectRef}-auth-token.0`,
      `sb-${projectRef}-auth-token.1`,
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
      }
    }

    if (fixed) {
    }
  } catch (error) {
    // Non-fatal: silently handled
  }
}
