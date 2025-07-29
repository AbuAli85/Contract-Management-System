export default async function LayoutTestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">🧪 Layout Test Page</h1>
        <p className="text-muted-foreground">Testing content rendering with simple layout</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Test Results:</h2>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>✅ <strong>Page Component:</strong> This page is rendering</li>
          <li>✅ <strong>Server Component:</strong> Async function working</li>
          <li>✅ <strong>Locale:</strong> {locale}</li>
          <li>✅ <strong>Simple Layout:</strong> No client component wrapper</li>
          <li>✅ <strong>Content:</strong> This text is visible</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-green-800">Expected Results:</h2>
        <ul className="space-y-2 text-sm text-green-700">
          <li>• Simple header should be visible</li>
          <li>• This content should be visible in the main area</li>
          <li>• No 404 errors in console</li>
          <li>• Page should load quickly</li>
        </ul>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          If you can see this content, the basic rendering is working!
        </p>
      </div>
    </div>
  )
} 