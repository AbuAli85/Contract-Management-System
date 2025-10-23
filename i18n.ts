import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'ar'];

// Import messages statically to avoid dynamic import issues
import enMessages from './i18n/messages/en.json';
import arMessages from './i18n/messages/ar.json';

const messages = {
  en: enMessages,
  ar: arMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  try {
    const locale = await requestLocale;

    // Validate that the incoming `locale` parameter is valid
    if (!locale || !locales.includes(locale as any)) {
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
export const defaultLocale = 'en' as const;
