import { getRequestConfig } from "next-intl/server";

const supportedLocales = ["en", "ar"];

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  if (!supportedLocales.includes(locale)) {
    locale = "en";
  }
  
  return {
    locale,
    messages: (await import(`../public/locales/${locale}.json`)).default,
  };
});