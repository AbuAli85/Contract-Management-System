"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔍 Testing Supabase connection in browser...')
      
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Environment variables in browser:')
      console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET')
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }

      // Create Supabase client
      const supabase = createClient()
      console.log('✅ Supabase client created successfully')
      
      // Test basic connection
      console.log('🔍 Testing basic connection...')
      const { data, error: dbError } = await supabase.from('users').select('count').limit(1)
      
      if (dbError) {
        console.error('❌ Connection test failed:', dbError.message)
        setError(`Database connection failed: ${dbError.message}`)
        return
      }
      
      console.log('✅ Basic connection successful')
      setResult({ type: 'connection', success: true, message: 'Database connection successful' })
      
    } catch (err) {
      console.error('❌ Connection test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔍 Testing authentication...')
      console.log('Email:', email)
      
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ Authentication failed:', error.message)
        setError(`Authentication failed: ${error.message}`)
        setResult({ type: 'auth', success: false, error: error.message })
      } else {
        console.log('✅ Authentication successful:', data)
        setResult({ type: 'auth', success: true, data })
      }
      
    } catch (err) {
      console.error('❌ Authentication error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Supabase Authentication Debug</h1>
      
      <div className="space-y-6">
        {/* Connection Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Authentication Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
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
              onClick={testAuth}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Authentication'}
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="border border-green-300 bg-green-50 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold">Result:</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 