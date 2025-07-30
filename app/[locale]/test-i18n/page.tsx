export default async function TestI18nPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Test API route
  let apiTestResult = "Not tested"
  try {
    const apiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/test-i18n`,
    )
    const apiData = await apiResponse.json()
    apiTestResult = apiData.success ? "✅ API route working" : "❌ API route failed"
  } catch (error) {
    apiTestResult = "❌ API route error: " + error
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">I18n Test Page</h1>
        <div className="space-y-4">
          <p>
            <strong>Current Locale:</strong> {locale}
          </p>
          <p>
            <strong>Loading Text:</strong> Loading...
          </p>
          <p>
            <strong>Dashboard Text:</strong> Dashboard
          </p>
          <p>
            <strong>Login Text:</strong> Login
          </p>
          <p>
            <strong>API Test:</strong> {apiTestResult}
          </p>
        </div>
        <div className="mt-6 space-x-4">
          <a
            href={`/${locale === "en" ? "ar" : "en"}`}
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Switch to {locale === "en" ? "Arabic" : "English"}
          </a>
          <a
            href={`/${locale}/dashboard`}
            className="inline-block rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Go to Dashboard
          </a>
          <a
            href="/api/test-i18n"
            target="_blank"
            className="inline-block rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Test API Route
          </a>
        </div>
      </div>
    </div>
  )
}
