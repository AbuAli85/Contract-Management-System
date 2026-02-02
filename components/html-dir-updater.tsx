'use client';

import { useEffect } from 'react';
import { getDirection } from '@/lib/i18n/rtl';

interface HtmlDirUpdaterProps {
  locale: string;
}

/**
 * Client component that updates the HTML element's dir and lang attributes
 * based on the current locale. This is needed because the root layout
 * renders before we know the locale.
 */
export function HtmlDirUpdater({ locale }: HtmlDirUpdaterProps) {
  useEffect(() => {
    const direction = getDirection(locale);
    
    // Update HTML element attributes
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', direction);
      document.documentElement.setAttribute('lang', locale);
      
      // Add/remove RTL class for styling
      if (direction === 'rtl') {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [locale]);

  // This component doesn't render anything
  return null;
}
