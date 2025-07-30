"use client";

import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "ar"] as const;
export const localePrefix = "as-needed";
export const defaultLocale = "en";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix,
  defaultLocale,
});