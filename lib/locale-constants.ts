// Default locale for server-side redirects and email links
// This should match the defaultLocale in next.config.js
export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;

// Cookie name used by next-intl / app locale preference
export const LOCALE_COOKIE = 'NEXT_LOCALE';

// Helper to build locale-aware paths for server-side use
export function localePath(
  path: string,
  locale: string = DEFAULT_LOCALE
): string {
  return `/${locale}${path.startsWith('/') ? path : '/' + path}`;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((s) => {
      const [k, v] = s.trim().split('=');
      try {
        return [k?.trim() ?? '', v ? decodeURIComponent(v) : ''];
      } catch {
        return [k?.trim() ?? '', v ?? ''];
      }
    })
  );
}

/**
 * Resolve locale for redirects (pages router getServerSideProps).
 * Priority: 1) locale cookie, 2) referer URL locale, 3) Accept-Language.
 */
export function getRedirectLocale(req: {
  cookies?: { [key: string]: string };
  headers?: { [key: string]: string | string[] | undefined };
}): string {
  const headers = req.headers ?? {};
  const cookies =
    req.cookies ?? parseCookieHeader(headers.cookie as string | undefined);
  const cookieLocale = cookies[LOCALE_COOKIE];
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as any)) {
    return cookieLocale;
  }
  const referer = headers.referer ?? headers.Referer;
  const refererStr = Array.isArray(referer) ? referer[0] : referer;
  if (refererStr && (refererStr.includes('/ar/') || refererStr.includes('/ar?'))) {
    return 'ar';
  }
  if (refererStr && (refererStr.includes('/en/') || refererStr.includes('/en?'))) {
    return 'en';
  }
  const acceptLang = headers['accept-language'] ?? headers['Accept-Language'];
  const langStr = Array.isArray(acceptLang) ? acceptLang[0] : acceptLang;
  if (langStr?.includes('ar')) return 'ar';
  return DEFAULT_LOCALE;
}

export type LocaleSource = 'cookie' | 'referer' | 'header';

/** NextRequest variant for middleware (Edge Runtime). Returns locale and source for logging. */
export function getRedirectLocaleFromRequest(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
  headers: { get: (name: string) => string | null };
}): { locale: string; source: LocaleSource } {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as any)) {
    return { locale: cookieLocale, source: 'cookie' };
  }
  const referer = request.headers.get('referer') ?? request.headers.get('Referer');
  if (referer && (referer.includes('/ar/') || referer.includes('/ar?'))) {
    return { locale: 'ar', source: 'referer' };
  }
  if (referer && (referer.includes('/en/') || referer.includes('/en?'))) {
    return { locale: 'en', source: 'referer' };
  }
  const acceptLang = request.headers.get('accept-language') ?? request.headers.get('Accept-Language');
  if (acceptLang?.includes('ar')) return { locale: 'ar', source: 'header' };
  return { locale: DEFAULT_LOCALE, source: 'header' };
}
