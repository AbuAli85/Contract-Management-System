/**
 * RTL (Right-to-Left) Support Configuration
 * 
 * Utilities for handling bilingual RTL/LTR layouts
 */

export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];
export const DEFAULT_LOCALE = 'en';

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: string): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get appropriate font family for locale
 */
export function getFontFamily(locale: string): string {
  return isRTL(locale) ? 'font-arabic' : 'font-sans';
}

/**
 * Get locale-specific class names
 */
export function getLocaleClasses(locale: string): string {
  const direction = getDirection(locale);
  const font = getFontFamily(locale);
  
  return `${direction} ${font}`;
}

/**
 * Direction-aware positioning classes
 * Use these instead of hardcoded left/right
 */
export const directionClasses = {
  // Margins
  marginStart: 'ms-', // replaces ml-
  marginEnd: 'me-',   // replaces mr-
  
  // Padding
  paddingStart: 'ps-', // replaces pl-
  paddingEnd: 'pe-',   // replaces pr-
  
  // Text alignment
  textStart: 'text-start',  // replaces text-left
  textEnd: 'text-end',      // replaces text-right
  
  // Borders
  borderStart: 'border-s-', // replaces border-l-
  borderEnd: 'border-e-',   // replaces border-r-
  
  // Rounded corners
  roundedStart: 'rounded-s-', // replaces rounded-l-
  roundedEnd: 'rounded-e-',   // replaces rounded-r-
} as const;

/**
 * Convert fixed directional classes to logical ones
 */
export function makeDirectionAgnostic(className: string): string {
  return className
    .replace(/\bml-/g, 'ms-')
    .replace(/\bmr-/g, 'me-')
    .replace(/\bpl-/g, 'ps-')
    .replace(/\bpr-/g, 'pe-')
    .replace(/\btext-left\b/g, 'text-start')
    .replace(/\btext-right\b/g, 'text-end')
    .replace(/\bborder-l-/g, 'border-s-')
    .replace(/\bborder-r-/g, 'border-e-')
    .replace(/\brounded-l-/g, 'rounded-s-')
    .replace(/\brounded-r-/g, 'rounded-e-');
}

