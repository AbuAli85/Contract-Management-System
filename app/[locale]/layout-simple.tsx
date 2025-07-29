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

export default async function SimpleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolvedLocale = await getLocale(locale)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Contract Management System - Simple Layout
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          🧭 Simple Layout: Children should render here
        </div>
        {children}
      </main>
    </div>
  )
} 