import { notFound } from "next/navigation"
import { getRequestConfig } from "next-intl/server"

// Can be imported from a shared config
const locales = ["en", "ar"]

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  const locale = await requestLocale
  
  // Add better error handling for undefined locale
  if (!locale || !locales.includes(locale as any)) {
    console.error("Invalid locale:", locale)
    notFound()
  }

  return {
    locale,
    messages: (await import(`./public/locales/${locale}.json`)).default,
  }
}) 