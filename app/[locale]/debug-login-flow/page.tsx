'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export default function DebugLoginFlowPage() {
  const { user, loading, mounted } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [cookieHistory, setCookieHistory] = useState<any[]>([])

  useEffect(() => {
    const checkCookies = async () => {
      try {
        const [sessionResponse, cookieValuesResponse] = await Promise.all([
          fetch('/api/debug/session'),
          fetch('/api/debug/cookie-values')
        ])

        const sessionData = await sessionResponse.json()
        const cookieData = await cookieValuesResponse.json()

        const newDebugInfo = {
          timestamp: new Date().toISOString(),
          clientUser: user ? user.email : null,
          clientLoading: loading,
          clientMounted: mounted,
          serverSession: sessionData.debug,
          cookies: cookieData.debug
        }

        setDebugInfo(newDebugInfo)
        setCookieHistory(prev => [...prev, newDebugInfo])

        console.log('🔧 Login flow debug:', newDebugInfo)
      } catch (error) {
        console.error('🔧 Debug check failed:', error)
      }
    }

    // Check immediately
    checkCookies()

    // Check every 2 seconds
    const interval = setInterval(checkCookies, 2000)

    return () => clearInterval(interval)
  }, [user, loading, mounted])

  const handleForceLogout = async () => {
    try {
      await fetch('/api/force-logout')
      window.location.reload()
    } catch (error) {
      console.error('Force logout failed:', error)
    }
  }

  const handleTestLogin = () => {
    window.location.href = '/en/auth/login'
  }

  const handleTestDashboard = () => {
    window.location.href = '/en/dashboard'
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Login Flow Debug</h1>
      
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Current State:</h2>
        <div className="space-y-2">
          <p><strong>Client User:</strong> {debugInfo.clientUser || 'None'}</p>
          <p><strong>Client Loading:</strong> {debugInfo.clientLoading ? 'Yes' : 'No'}</p>
          <p><strong>Client Mounted:</strong> {debugInfo.clientMounted ? 'Yes' : 'No'}</p>
          <p><strong>Server Has Session:</strong> {debugInfo.serverSession?.hasSession ? 'Yes' : 'No'}</p>
          <p><strong>Server User:</strong> {debugInfo.serverSession?.userEmail || 'None'}</p>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Cookie Status:</h2>
        <div className="space-y-2">
          <p><strong>Auth Token 0:</strong> {debugInfo.cookies?.authToken0?.exists ? 'Present' : 'Missing'} 
            {debugInfo.cookies?.authToken0?.value?.endsWith('...') && ' (TRUNCATED)'}
            {debugInfo.cookies?.authToken0?.length > 3000 && ` (TOO LARGE: ${debugInfo.cookies?.authToken0?.length} chars)`}
          </p>
          <p><strong>Auth Token 1:</strong> {debugInfo.cookies?.authToken1?.exists ? 'Present' : 'Missing'}
            {debugInfo.cookies?.authToken1?.value?.endsWith('...') && ' (TRUNCATED)'}
            {debugInfo.cookies?.authToken1?.length > 3000 && ` (TOO LARGE: ${debugInfo.cookies?.authToken1?.length} chars)`}
          </p>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Actions:</h2>
        <div className="space-x-4">
          <button
            onClick={handleForceLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Force Logout
          </button>
          <button
            onClick={handleTestLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Login
          </button>
          <button
            onClick={handleTestDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Dashboard
          </button>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Cookie History (Last 5):</h2>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {cookieHistory.slice(-5).map((entry, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
              <p><strong>Time:</strong> {new Date(entry.timestamp).toLocaleTimeString()}</p>
              <p><strong>Client User:</strong> {entry.clientUser || 'None'}</p>
              <p><strong>Server Session:</strong> {entry.serverSession?.hasSession ? 'Yes' : 'No'}</p>
              <p><strong>Cookies:</strong> {entry.cookies?.authToken0?.exists ? 'Present' : 'Missing'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Watch the "Current State" and "Cookie Status" sections</li>
          <li>Try logging in and observe the changes</li>
          <li>If cookies are truncated or too large, the middleware will clear them</li>
          <li>Check the "Cookie History" to see the pattern</li>
        </ol>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 