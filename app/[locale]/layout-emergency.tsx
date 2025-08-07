import { NextIntlClientProvider } from "next-intl"
import { setRequestLocale } from "next-intl/server"

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }]
}

export default async function EmergencyLayout({
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
    return (
      <html lang="en">
        <body>
          <div>Invalid locale</div>
        </body>
      </html>
    )
  }

  // Set the request locale FIRST to enable static rendering
  setRequestLocale(locale)

  // Use empty messages to avoid dynamic rendering issues
  const messages = {}

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <div className="min-h-screen">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
              <p className="font-bold">🚨 Emergency Mode Active</p>
              <p>All authentication components have been disabled to prevent infinite loops.</p>
            </div>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
