'use client'

import { useAuth } from '@/app/providers'

export default function TestProviderPage() {
  try {
    const { user, loading, mounted } = useAuth()
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AuthProvider Test
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span>Loading: {loading ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${mounted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Mounted: {mounted ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>User: {user ? 'Logged In' : 'Not Logged In'}</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">✅ AuthProvider is working correctly!</p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AuthProvider Test
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">❌ AuthProvider Error:</p>
              <pre className="text-sm mt-2 text-red-700">
                {error instanceof Error ? error.message : 'Unknown error'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }
} 