'use client'

import { useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export default function TestLoginPage() {
  const { signIn, user, loading } = useAuth()
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpassword123')
  const [status, setStatus] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Logging in...')
    
    try {
      const result = await signIn(email, password)
      if (result.error) {
        setStatus(`Error: ${result.error}`)
      } else {
        setStatus('Login successful!')
      }
    } catch (error) {
      setStatus(`Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Test Login Page
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Direct authentication test (bypasses middleware)
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <strong>Current Status:</strong>
            <div className="text-sm text-gray-600">
              {loading ? 'Loading...' : user ? `Logged in as: ${user.email}` : 'Not logged in'}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </button>
          </form>

          {status && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <strong>Status:</strong> {status}
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <strong>Test Credentials:</strong><br />
            Email: test@example.com<br />
            Password: testpassword123
          </div>

          {user && (
            <div className="mt-4">
              <a
                href="/en/dashboard"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 