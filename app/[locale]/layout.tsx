import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
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
