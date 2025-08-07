"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-service'
import { useSupabase } from '@/app/providers'

export default function SimpleTestPage() {
  const { user, session, loading, supabase } = useSupabase()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authResult, setAuthResult] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleTestAuth = async () => {
    if (!email || !password) {
      setAuthResult({ error: 'Please enter both email and password' })
      return
    }

    try {
      const result = await signIn(email, password)
      setAuthResult(result)
    } catch (error) {
      setAuthResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Simple Authentication Test</h1>
      
      <div className="space-y-6">
        {/* Auth Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? user.email : 'None'}</div>
            <div><strong>Session:</strong> {session ? 'Active' : 'None'}</div>
            <div><strong>Supabase Client:</strong> {supabase ? 'Available' : 'Not Available'}</div>
          </div>
        </div>

        {/* Test Authentication */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="password"
              />
            </div>
            <button
              onClick={handleTestAuth}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Sign In
            </button>
          </div>
        </div>

        {/* Results */}
        {authResult && (
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 