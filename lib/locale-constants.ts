// Default locale for server-side redirects and email links
// This should match the defaultLocale in next.config.js
export const DEFAULT_LOCALE = 'en';

// Helper to build locale-aware paths for server-side use
export function localePath(
  path: string,
  locale: string = DEFAULT_LOCALE
): string {
  return `/${locale}${path.startsWith('/') ? path : '/' + path}`;
}
