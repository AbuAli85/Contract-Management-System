'use client'

import { useAuth } from '@/app/providers'

function TestAuthContent() {
  try {
    const auth = useAuth()
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800">✅ AuthProvider is working!</h3>
        <p className="text-sm text-green-700 mt-2">
          User: {auth.user ? 'Logged in' : 'Not logged in'}
        </p>
        <p className="text-sm text-green-700">
          Loading: {auth.loading ? 'Yes' : 'No'}
        </p>
        <p className="text-sm text-green-700">
          Mounted: {auth.mounted ? 'Yes' : 'No'}
        </p>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold text-red-800">❌ AuthProvider Error</h3>
        <p className="text-sm text-red-700 mt-2">
          Error: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    )
  }
}

export default function TestAuthProviderPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          AuthProvider Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AuthProvider Status</h2>
          <TestAuthContent />
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go Home
            </a>
            <a href="/en/auth/login" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Login Page
            </a>
            <a href="/emergency" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Emergency Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 