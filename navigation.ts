/**
 * Next-intl Navigation Configuration
 * Provides localized routing utilities for the application
 */

import { createSharedPathnamesNavigation } from 'next-intl/navigation';

// Define supported locales
export const locales = ['en', 'ar'] as const;
export const defaultLocale = 'en' as const;

// Create navigation utilities with shared pathnames across locales
export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
