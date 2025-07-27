'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'

export default function TestClientSessionPage() {
  const { user, loading, mounted, session } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkSession = async () => {
             try {
         const [sessionResponse, checkSessionResponse] = await Promise.all([
           fetch('/api/debug/session'),
           fetch('/api/auth/check-session')
         ])

         const sessionData = await sessionResponse.json()
         const checkSessionData = await checkSessionResponse.json()

         const newDebugInfo = {
           timestamp: new Date().toISOString(),
           clientUser: user ? user.email : null,
           clientLoading: loading,
           clientMounted: mounted,
           clientSession: !!session,
           serverSession: sessionData.debug,
           checkSession: checkSessionData,
         }

        setDebugInfo(newDebugInfo)
        console.log('🔧 Client session debug:', newDebugInfo)
      } catch (error) {
        console.error('🔧 Debug check failed:', error)
      }
    }

    checkSession()
  }, [user, loading, mounted, session])

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Client Session Debug</h1>
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Client State:</h2>
        <div className="space-y-2">
          <p><strong>Client User:</strong> {debugInfo.clientUser || 'None'}</p>
          <p><strong>Client Loading:</strong> {debugInfo.clientLoading ? 'Yes' : 'No'}</p>
          <p><strong>Client Mounted:</strong> {debugInfo.clientMounted ? 'Yes' : 'No'}</p>
          <p><strong>Client Session:</strong> {debugInfo.clientSession ? 'Yes' : 'No'}</p>
        </div>
      </div>
             <div className="p-4 border rounded">
         <h2 className="font-semibold mb-2">Server State:</h2>
         <div className="space-y-2">
           <p><strong>Server Has Session:</strong> {debugInfo.serverSession?.hasSession ? 'Yes' : 'No'}</p>
           <p><strong>Server User:</strong> {debugInfo.serverSession?.userEmail || 'None'}</p>
         </div>
       </div>
       <div className="p-4 border rounded">
         <h2 className="font-semibold mb-2">Check Session API:</h2>
         <div className="space-y-2">
           <p><strong>Has Session:</strong> {debugInfo.checkSession?.hasSession ? 'Yes' : 'No'}</p>
           <p><strong>User:</strong> {debugInfo.checkSession?.user?.email || 'None'}</p>
           <p><strong>Success:</strong> {debugInfo.checkSession?.success ? 'Yes' : 'No'}</p>
         </div>
       </div>
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Actions:</h2>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => window.location.href = '/en/auth/login'} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Try logging in and observe the changes</li>
          <li>Check if client and server states match</li>
          <li>If they don't match, there's a session sync issue</li>
          <li>Use "Refresh Page" to force client session refresh</li>
        </ol>
      </div>
    </div>
  )
} 