/**
 * CSP Nonce Generation Utility
 *
 * Provides cryptographically secure nonce generation for Content-Security-Policy.
 * This module works on the server side to generate unique nonces per request.
 *
 * @see CSP_NONCE_IMPLEMENTATION_GUIDE.md for full implementation details
 */

/**
 * Generate a cryptographically secure nonce for CSP
 *
 * Uses Web Crypto API for secure random bytes, falling back to Math.random
 * only when crypto is unavailable (should never happen in modern Node.js)
 *
 * @returns A base64-encoded nonce string (16 bytes = 128 bits of entropy)
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * // Returns something like: "x7Hy9sKmLpNqRtUvWxYz=="
 * ```
 */
export function generateNonce(): string {
  // Use crypto module for server-side generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Fallback for environments without crypto (should not happen)
  console.warn('⚠️ Crypto API unavailable, using fallback nonce generation');
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
}

/**
 * Build CSP header string with nonce
 *
 * Creates a complete Content-Security-Policy header string with the provided
 * nonce embedded in script-src and style-src directives.
 *
 * @param nonce - The nonce value to embed in the CSP
 * @param options - Configuration options for the CSP
 * @returns Complete CSP header string
 *
 * @example
 * ```ts
 * const csp = buildCSPWithNonce('abc123', { isDevelopment: false });
 * response.headers.set('Content-Security-Policy', csp);
 * ```
 */
export function buildCSPWithNonce(
  nonce: string,
  options: {
    isDevelopment?: boolean;
    allowGoogleAnalytics?: boolean;
    allowSentry?: boolean;
    allowMakeCom?: boolean;
  } = {}
): string {
  const {
    isDevelopment = process.env.NODE_ENV === 'development',
    allowGoogleAnalytics = true,
    allowSentry = true,
    allowMakeCom = true,
  } = options;

  // In development, we need unsafe-eval for Fast Refresh
  // In production, we can remove it for better security
  const evalDirective = isDevelopment ? "'unsafe-eval'" : '';

  // Build external sources
  const externalScripts: string[] = [
    'https://vercel.live',
    'https://maps.googleapis.com',
    'https://ajax.googleapis.com',
  ];
  const externalConnect: string[] = [
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://vercel.live',
    'https://maps.googleapis.com',
    'https://ajax.googleapis.com',
  ];
  const externalImages: string[] = [
    'https://*.supabase.co',
    'https://maps.gstatic.com',
  ];

  if (allowGoogleAnalytics) {
    externalScripts.push(
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com'
    );
    externalConnect.push(
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com'
    );
    externalImages.push(
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com'
    );
  }

  if (allowSentry) {
    externalConnect.push('https://*.sentry.io');
  }

  if (allowMakeCom) {
    externalConnect.push('https://hook.eu2.make.com');
    externalImages.push('https://hook.eu2.make.com');
  }

  const cspDirectives = [
    // Default: only allow from same origin
    "default-src 'self'",

    // Scripts: self, nonce-based inline, and trusted CDNs
    // Note: We still include 'unsafe-inline' as a fallback for Next.js hydration
    // The nonce takes precedence when present
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' ${evalDirective} ${externalScripts.join(' ')}`.trim(),

    // Styles: self, nonce-based inline, and Google Fonts
    // Note: 'unsafe-inline' is still needed for styled-jsx and some CSS-in-JS
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,

    // Images: self, data URIs, blobs, and trusted sources
    `img-src 'self' data: blob: ${externalImages.join(' ')}`,

    // Fonts: self, data URIs, and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",

    // API connections
    `connect-src 'self' ${externalConnect.join(' ')}`,

    // Frames: self and Vercel live preview
    "frame-src 'self' https://vercel.live",

    // Frame ancestors: prevent embedding
    "frame-ancestors 'none'",

    // Object embeds: disabled
    "object-src 'none'",

    // Base URI: same origin only
    "base-uri 'self'",

    // Upgrade HTTP to HTTPS
    'upgrade-insecure-requests',

    // Form submissions: same origin only
    "form-action 'self'",

    // Media: self and Supabase storage
    "media-src 'self' https://*.supabase.co",

    // Manifest: same origin only
    "manifest-src 'self'",
  ];

  return cspDirectives.join('; ');
}

/**
 * Get Content-Security-Policy-Report-Only header for testing
 *
 * Use this to test CSP changes without blocking content.
 * Reports will be sent to the specified endpoint.
 *
 * @param nonce - The nonce value to embed
 * @param reportUri - Endpoint to receive CSP violation reports
 * @returns CSP-Report-Only header string
 */
export function buildCSPReportOnly(
  nonce: string,
  reportUri: string = '/api/csp-report'
): string {
  const baseCSP = buildCSPWithNonce(nonce, { isDevelopment: false });
  return `${baseCSP}; report-uri ${reportUri}`;
}
