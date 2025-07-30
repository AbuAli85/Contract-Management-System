const { getRequestConfig } = require("next-intl/server")
const { cookies } = require("next/headers")

const supportedLocales = ["en", "ar"]

module.exports = getRequestConfig(async () => {
  const cookieStore = await cookies()
  let locale = cookieStore.get("locale")?.value || "en"
  if (!supportedLocales.includes(locale)) {
    locale = "en"
  }
  return {
    locale,
    messages: (await import(`./public/locales/${locale}.json`)).default,
  }
})
