export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"],
  defaultNS: "common",
  localePath: "./public/locales",
  fallbackLocale: "en",
}

export type Locale = (typeof i18n)["locales"][number]

export function isValidLocale(locale: string): boolean {
  return i18n.locales.includes(locale as Locale)
}
