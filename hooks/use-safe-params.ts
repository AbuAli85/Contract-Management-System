import { useParams as useNextParams } from 'next/navigation';
import { usePathname as useNextPathname } from 'next/navigation';

/**
 * Safe wrapper around Next.js useParams that handles edge cases
 * where params might be undefined or null
 */
export function useSafeParams() {
  try {
    const params = useNextParams();

    // Ensure we always return an object, even if params is undefined
    if (!params || typeof params !== 'object') {
      console.warn('🚨 useParams returned undefined or invalid value:', params);
      return {};
    }

    return params;
  } catch (error) {
    console.error('🚨 Error in useParams:', error);
    return {};
  }
}

/**
 * Safe wrapper around Next.js usePathname that handles edge cases
 * where pathname might be undefined or null
 */
export function useSafePathname(): string {
  try {
    const pathname = useNextPathname();

    // Ensure we always return a string, even if pathname is undefined
    if (!pathname || typeof pathname !== 'string') {
      console.warn(
        '🚨 usePathname returned undefined or invalid value:',
        pathname
      );
      return '/';
    }

    return pathname;
  } catch (error) {
    console.error('🚨 Error in usePathname:', error);
    return '/';
  }
}

/**
 * Get locale from params with fallback
 */
export function useLocaleFromParams(): string {
  const params = useSafeParams();
  const locale = (params?.locale as string) || 'en';

  // Validate locale is a reasonable value
  if (typeof locale !== 'string' || locale.length > 10) {
    console.warn('🚨 Invalid locale detected:', locale, 'falling back to "en"');
    return 'en';
  }

  return locale;
}
