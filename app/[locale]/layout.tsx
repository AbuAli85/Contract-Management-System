import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { AuthLayoutWrapper } from "@/components/auth-layout-wrapper"
import { ErrorBoundary } from "@/components/error-boundary"

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale
  if (!locale || !["en", "ar"].includes(locale)) {
    console.error("Invalid locale:", locale)
    // Return a fallback layout instead of throwing
    return (
      <html lang="en">
        <body>
          <div>Invalid locale</div>
        </body>
      </html>
    )
  }

  // Set the request locale to enable static rendering
  setRequestLocale(locale)

  // Get messages for the current locale
  let messages
  try {
    messages = await getMessages()
  } catch (error) {
    console.error("🔐 Locale Layout: Error getting messages:", error)
    // Fallback to empty messages if there's an error
    messages = {}
  }

  return (
    <ErrorBoundary>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
      </NextIntlClientProvider>
    </ErrorBoundary>
  )
}
