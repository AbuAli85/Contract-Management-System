import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { getRequestConfig as createRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const supportedLocales = ['en', 'ar'];

// Import messages statically to avoid dynamic import issues
import enMessages from './i18n/messages/en.json';
import arMessages from './i18n/messages/ar.json';

const messages = {
  en: enMessages,
  ar: arMessages,
};

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ar'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Exclude API routes from locale routing
  pathnames: {
    // API routes should not be localized
    '/api': '/api',
    '/api/*': '/api/*',
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

// Export the request configuration as a default export (required by next-intl)
export default createRequestConfig(async ({ requestLocale }) => {
  try {
    const locale = await requestLocale;

    // Validate that the incoming `locale` parameter is valid
    if (!locale || !supportedLocales.includes(locale as any)) {
      console.warn('Invalid locale:', locale, "falling back to 'en'");
      return {
        locale: 'en',
        messages: messages.en,
        timeZone: 'UTC',
      };
    }

    // Get messages for the locale
    const localeMessages =
      messages[locale as keyof typeof messages] || messages.en;

    return {
      locale,
      messages: localeMessages,
      timeZone: 'UTC',
    };
  } catch (error) {
    console.error('Error in i18n config:', error);
    // Return a safe fallback
    return {
      locale: 'en',
      messages: messages.en,
      timeZone: 'UTC',
    };
  }
});

// Export locale configuration
export const locales = ['en', 'ar'] as const;
