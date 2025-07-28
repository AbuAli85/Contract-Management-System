'use client'

import { useAuth } from '@/src/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DebugRedirectPage() {
  const { user, loading, mounted } = useAuth()
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const [sessionResponse, cookiesResponse, cookieValuesResponse, sessionDirectResponse] = await Promise.all([
          fetch('/api/debug/session'),
          fetch('/api/debug/cookies'),
          fetch('/api/debug/cookie-values'),
          fetch('/api/test-session-direct')
        ])
        
        const sessionData = await sessionResponse.json()
        const cookiesData = await cookiesResponse.json()
        const cookieValuesData = await cookieValuesResponse.json()
        const sessionDirectData = await sessionDirectResponse.json()
        
        setDebugInfo({
          session: sessionData,
          cookies: cookiesData,
          cookieValues: cookieValuesData,
          sessionDirect: sessionDirectData
        })
      } catch (error) {
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    fetchDebugInfo()
  }, [])

  const handleRedirect = () => {
    router.push('/en/dashboard')
  }

  const handleForceRedirect = () => {
    window.location.href = '/en/dashboard'
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Redirect Issue</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Auth State:</h2>
          <p>User: {user ? user.email : 'None'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Server Session:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(debugInfo.session, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Cookies:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(debugInfo.cookies, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Cookie Values:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(debugInfo.cookieValues, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Direct Session Test:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(debugInfo.sessionDirect, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Actions:</h2>
          <div className="space-x-4">
            <button 
              onClick={handleRedirect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Router Push to Dashboard
            </button>
            <button 
              onClick={handleForceRedirect}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Force Redirect (window.location)
            </button>
            <button 
              onClick={async () => {
                await fetch('/api/force-logout')
                window.location.href = '/en/auth/login'
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Force Logout & Clear Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 