'use client'

import { useEffect, useState } from 'react'

export default function TestCookieFixPage() {
  const [status, setStatus] = useState<string>('Testing...')
  const [cookies, setCookies] = useState<any>(null)

  useEffect(() => {
    const testCookies = async () => {
      try {
        // First, check current cookies
        const response = await fetch('/api/debug/cookie-values')
        const data = await response.json()
        setCookies(data.debug)

        // Check if cookies are truncated
        const hasTruncatedCookies = data.debug.authToken0?.value?.endsWith('...') || 
                                   data.debug.authToken1?.value?.endsWith('...')

        if (hasTruncatedCookies) {
          setStatus('Truncated cookies detected! Clearing them...')
          
          // Clear cookies
          await fetch('/api/clear-cookies')
          
          setStatus('Cookies cleared! You can now try logging in again.')
        } else {
          setStatus('Cookies look good!')
        }
      } catch (error) {
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    testCookies()
  }, [])

  const handleClearCookies = async () => {
    setStatus('Clearing cookies...')
    try {
      await fetch('/api/clear-cookies')
      setStatus('Cookies cleared! Refresh the page to see the results.')
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleGoToLogin = () => {
    window.location.href = '/en/auth/login'
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Cookie Fix Test</h1>
      
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p className="text-lg">{status}</p>
      </div>

      {cookies && (
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Cookie Analysis:</h2>
          <div className="space-y-2">
            <p><strong>Auth Token 0:</strong> {cookies.authToken0?.exists ? 'Present' : 'Missing'} 
              {cookies.authToken0?.value?.endsWith('...') && ' (TRUNCATED)'}
              {cookies.authToken0?.length > 3000 && ` (TOO LARGE: ${cookies.authToken0.length} chars)`}
            </p>
            <p><strong>Auth Token 1:</strong> {cookies.authToken1?.exists ? 'Present' : 'Missing'}
              {cookies.authToken1?.value?.endsWith('...') && ' (TRUNCATED)'}
              {cookies.authToken1?.length > 3000 && ` (TOO LARGE: ${cookies.authToken1.length} chars)`}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Actions:</h2>
        <div className="space-x-4">
          <button
            onClick={handleClearCookies}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Cookies
          </button>
          <button
            onClick={handleGoToLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
      </div>

      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>If cookies are truncated or too large, click "Clear All Cookies"</li>
          <li>Click "Go to Login" to try logging in again</li>
          <li>If the issue persists, the middleware should automatically detect and clear invalid cookies</li>
        </ol>
      </div>
    </div>
  )
} 