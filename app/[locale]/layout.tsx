import { i18n } from '@/src/i18n/i18n-config'
import { ClientLayout } from '@/src/components/client-layout'
import { cookies } from 'next/headers'
import { AuthProvider } from '@/context/AuthProvider'

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }))
}

async function getLocale(locale?: string) {
  try {
    if (locale && i18n.locales.includes(locale)) {
      return locale
    }
    return i18n.defaultLocale
  } catch (error) {
    console.error('Error getting locale:', error)
    return i18n.defaultLocale
  }
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolvedLocale = await getLocale(locale)
  return (
    <AuthProvider>
      <ClientLayout locale={resolvedLocale}>
        {children}
      </ClientLayout>
    </AuthProvider>
  )
}
