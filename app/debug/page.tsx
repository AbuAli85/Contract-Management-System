"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)

    // Test if basic React is working
    try {
      console.log("Debug page loaded successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Debug Page</h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="mr-3 h-3 w-3 rounded-full bg-green-500"></div>
              <span>React is working</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-3 w-3 rounded-full bg-green-500"></div>
              <span>Client-side rendering is working</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-3 w-3 rounded-full bg-green-500"></div>
              <span>Tailwind CSS is working</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 font-semibold text-red-800">Error Detected:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Navigation Links</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">
              Home (/)
            </a>
            <a href="/en" className="block text-blue-600 hover:underline">
              Localized Home (/en)
            </a>
            <a href="/en/auth/login" className="block text-blue-600 hover:underline">
              Login (/en/auth/login)
            </a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">
              Dashboard (/dashboard)
            </a>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div>Node Environment: {process.env.NODE_ENV}</div>
            <div>Next.js Version: {process.env.NEXT_PUBLIC_VERSION || "Unknown"}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
