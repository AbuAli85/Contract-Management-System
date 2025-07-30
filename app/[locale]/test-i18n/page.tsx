import { useTranslations } from 'next-intl'

export default async function TestI18nPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = useTranslations('common')
  
  // Test API route
  let apiTestResult = 'Not tested'
  try {
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/test-i18n`)
    const apiData = await apiResponse.json()
    apiTestResult = apiData.success ? '✅ API route working' : '❌ API route failed'
  } catch (error) {
    apiTestResult = '❌ API route error: ' + error
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">I18n Test Page</h1>
        <div className="space-y-4">
          <p><strong>Current Locale:</strong> {locale}</p>
          <p><strong>Loading Text:</strong> {t('loading')}</p>
          <p><strong>Dashboard Text:</strong> {t('dashboard')}</p>
          <p><strong>Login Text:</strong> {t('login')}</p>
          <p><strong>API Test:</strong> {apiTestResult}</p>
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
          <a 
            href="/api/test-i18n"
            target="_blank"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test API Route
          </a>
        </div>
      </div>
    </div>
  )
} 