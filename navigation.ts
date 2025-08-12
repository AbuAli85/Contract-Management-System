import { createSharedPathnamesNavigation } from 'next-intl/navigation';

const locales = ['en', 'ar'] as const;

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({
    locales,
    localePrefix: 'always',
  });
