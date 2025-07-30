import { getRequestConfig } from "next-intl/server"

// Can be imported from a shared config
const locales = ["en", "ar"]

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    console.error("Invalid locale:", locale)
    // Return a fallback instead of notFound() to avoid build issues
    return {
      locale: "en",
      messages: {},
    }
  }

  // Load messages for the locale
  let messages
  try {
    messages = (await import(`./i18n/messages/${locale}.json`)).default
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    // Fallback to English messages
    try {
      messages = (await import(`./i18n/messages/en.json`)).default
    } catch (fallbackError) {
      console.error("Failed to load fallback messages:", fallbackError)
      messages = {}
    }
  }

  return {
    locale,
    messages,
  }
}) 