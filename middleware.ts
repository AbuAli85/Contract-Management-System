import createMiddleware from 'next-intl/middleware';
import { i18n } from './src/i18n/i18n-config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: i18n.locales,
  
  // Used when no locale matches
  defaultLocale: i18n.defaultLocale,
  
  // Always show the locale in the URL
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ar|en)/:path*']
};
