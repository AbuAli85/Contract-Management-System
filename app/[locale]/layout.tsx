import { i18n } from '@/src/i18n/i18n-config'
import { ClientLayout } from '@/src/components/client-layout'
import { cookies } from 'next/headers'
import { AuthenticatedLayout } from '@/auth/components/authenticated-layout'

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }))
}

async function getLocale(locale: string) {
    const cookieStore = await cookies()
    const savedLocale = cookieStore.get('locale')
    
    if (savedLocale && i18n.locales.includes(savedLocale.value)) {
        return savedLocale.value
    }
    
    if (i18n.locales.includes(locale)) {
        return locale
    }
    
    return i18n.defaultLocale
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolvedLocale = await getLocale(locale)
  
  return (
    <ClientLayout locale={resolvedLocale}>
      {children}
    </ClientLayout>
  )
}
