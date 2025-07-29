import { i18n } from '@/src/i18n/i18n-config'
import { cookies } from 'next/headers'

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

export default async function LayoutWithoutSidebar({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolvedLocale = await getLocale(locale)
  
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 