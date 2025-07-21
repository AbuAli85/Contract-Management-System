import { i18n } from '@/src/i18n/i18n-config'
import { ClientLayout } from '@/src/components/client-layout'
import { cookies } from 'next/headers'

interface LocaleLayoutProps {
    children: React.ReactNode
    params: { locale: string }
}

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }))
}

async function getLocale(params: { locale?: string }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const locale = resolvedParams?.locale
    if (locale && i18n.locales.includes(locale)) {
      return locale
    }
    return i18n.defaultLocale
  } catch (error) {
    console.error('Error getting locale:', error)
    return i18n.defaultLocale
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = await getLocale(params)
  return (
    <ClientLayout locale={locale}>
      {children}
    </ClientLayout>
  )
}
