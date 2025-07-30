"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/src/components/auth/simple-auth-provider"

export default function TestClientSessionPage() {
  const { user, loading, mounted, session } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Only run on mount
  useEffect(() => {
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSession = async () => {
    try {
      const [sessionResponse, checkSessionResponse] = await Promise.all([
        fetch("/api/debug/session"),
        fetch("/api/auth/check-session"),
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
      console.log("🔧 Client session debug:", newDebugInfo)
    } catch (error) {
      console.error("🔧 Debug check failed:", error)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Client Session Debug</h1>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Client State:</h2>
        <div className="space-y-2">
          <p>
            <strong>Client User:</strong> {debugInfo.clientUser || "None"}
          </p>
          <p>
            <strong>Client Loading:</strong> {debugInfo.clientLoading ? "Yes" : "No"}
          </p>
          <p>
            <strong>Client Mounted:</strong> {debugInfo.clientMounted ? "Yes" : "No"}
          </p>
          <p>
            <strong>Client Session:</strong> {debugInfo.clientSession ? "Yes" : "No"}
          </p>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Server State:</h2>
        <div className="space-y-2">
          <p>
            <strong>Server Has Session:</strong>{" "}
            {debugInfo.serverSession?.hasSession ? "Yes" : "No"}
          </p>
          <p>
            <strong>Server User:</strong> {debugInfo.serverSession?.userEmail || "None"}
          </p>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Check Session API:</h2>
        <div className="space-y-2">
          <p>
            <strong>Has Session:</strong> {debugInfo.checkSession?.hasSession ? "Yes" : "No"}
          </p>
          <p>
            <strong>User:</strong> {debugInfo.checkSession?.user?.email || "None"}
          </p>
          <p>
            <strong>Success:</strong> {debugInfo.checkSession?.success ? "Yes" : "No"}
          </p>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-semibold">Actions:</h2>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button
            onClick={() => (window.location.href = "/en/auth/login")}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
      <div className="rounded border bg-yellow-50 p-4">
        <h2 className="mb-2 font-semibold">Instructions:</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Try logging in and observe the changes</li>
          <li>Check if client and server states match</li>
          <li>If they don't match, there's a session sync issue</li>
          <li>Use "Refresh Page" to force client session refresh</li>
        </ol>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
