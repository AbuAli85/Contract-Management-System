import { useTranslations } from 'next-intl'

export default async function TestI18nPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = useTranslations('common')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">I18n Test Page</h1>
        <div className="space-y-4">
          <p><strong>Current Locale:</strong> {locale}</p>
          <p><strong>Loading Text:</strong> {t('loading')}</p>
          <p><strong>Dashboard Text:</strong> {t('dashboard')}</p>
          <p><strong>Login Text:</strong> {t('login')}</p>
        </div>
        <div className="mt-6 space-x-4">
          <a 
            href={`/${locale === 'en' ? 'ar' : 'en'}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Switch to {locale === 'en' ? 'Arabic' : 'English'}
          </a>
          <a 
            href={`/${locale}/dashboard`}
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
} 