import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AppLayoutWithSidebar } from '@/components/app-layout-with-sidebar'
import SimpleLayout from './layout-simple'
import { ErrorBoundary } from '@/components/error-boundary'

export async function generateStaticParams() {
    return [
        { locale: 'en' },
        { locale: 'ar' }
    ]
}

export default async function LocaleLayout({ 
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
        <AppLayoutWithSidebar>
          {children}
        </AppLayoutWithSidebar>
      </NextIntlClientProvider>
    </ErrorBoundary>
  )
}
