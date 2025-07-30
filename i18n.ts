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

  // Use static messages to avoid dynamic rendering
  const messages = {}

  return {
    locale,
    messages,
  }
}) 