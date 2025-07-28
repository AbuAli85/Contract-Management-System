export default function TestBuild() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Build Test Page
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This page tests basic Next.js functionality
        </p>
        <div className="space-x-4">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
          <a 
            href="/test-simple" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Simple
          </a>
        </div>
      </div>
    </div>
  )
} 