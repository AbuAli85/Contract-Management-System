import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function AuthLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params
  
  // Get messages for the current locale
  const messages = await getMessages()
  
  return (
    <ErrorBoundary>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className="min-h-screen bg-gray-50">
          {/* Simple header for auth pages */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 py-3">
              <h1 className="text-lg font-semibold text-gray-900">
                Contract Management System
              </h1>
            </div>
          </header>

          {/* Main content */}
          <main>
            {children}
          </main>
        </div>
      </NextIntlClientProvider>
    </ErrorBoundary>
  )
} 