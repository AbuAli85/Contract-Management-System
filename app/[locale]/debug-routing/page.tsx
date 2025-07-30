"use client"

import { useParams, usePathname, use } from "next/navigation"
import { useAuth } from "@/src/components/auth/simple-auth-provider"

export default function DebugRoutingPage() {
  const params = useParams()
  const pathname = usePathname()
  const { user, loading, mounted } = useAuth()

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Routing Debug Page</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Route Information */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h2 className="mb-3 text-xl font-semibold text-blue-800">Route Information</h2>
          <div className="space-y-2">
            <div>
              <strong>Pathname:</strong>
              <code className="ml-2 rounded bg-blue-100 px-2 py-1 text-sm">{pathname}</code>
            </div>
            <div>
              <strong>Params:</strong>
              <pre className="mt-2 overflow-auto rounded bg-blue-100 p-2 text-sm">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="rounded-lg bg-green-50 p-4">
          <h2 className="mb-3 text-xl font-semibold text-green-800">Authentication Status</h2>
          <div className="space-y-2">
            <div>
              <strong>Loading:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 text-sm ${loading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
              >
                {loading ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <strong>Mounted:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 text-sm ${mounted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {mounted ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <strong>User:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 text-sm ${user ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {user ? "Authenticated" : "Not Authenticated"}
              </span>
            </div>
            {user && (
              <div>
                <strong>User Email:</strong>
                <code className="ml-2 rounded bg-green-100 px-2 py-1 text-sm">{user.email}</code>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="rounded-lg bg-purple-50 p-4">
          <h2 className="mb-3 text-xl font-semibold text-purple-800">Navigation Links</h2>
          <div className="space-y-2">
            <a
              href={`/${params.locale}/dashboard`}
              className="block text-purple-600 hover:text-purple-800 hover:underline"
            >
              → Dashboard
            </a>
            <a
              href={`/${params.locale}/dashboard/simple-page`}
              className="block text-purple-600 hover:text-purple-800 hover:underline"
            >
              → Simple Dashboard
            </a>
            <a
              href={`/${params.locale}/auth/login`}
              className="block text-purple-600 hover:text-purple-800 hover:underline"
            >
              → Login Page
            </a>
            <a
              href={`/${params.locale}/dashboard/test-page`}
              className="block text-purple-600 hover:text-purple-800 hover:underline"
            >
              → Test Page
            </a>
          </div>
        </div>

        {/* Environment Information */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="mb-3 text-xl font-semibold text-gray-800">Environment</h2>
          <div className="space-y-2">
            <div>
              <strong>NODE_ENV:</strong>
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {process.env.NODE_ENV}
              </code>
            </div>
            <div>
              <strong>Build Time:</strong>
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {new Date().toISOString()}
              </code>
            </div>
            <div>
              <strong>User Agent:</strong>
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm text-xs">
                {typeof window !== "undefined"
                  ? window.navigator.userAgent.substring(0, 50) + "..."
                  : "Server-side"}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* API Test Section */}
      <div className="mt-8 rounded-lg bg-yellow-50 p-4">
        <h2 className="mb-3 text-xl font-semibold text-yellow-800">API Tests</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/health")
                  const data = await response.json()
                  alert(`Health Check: ${JSON.stringify(data, null, 2)}`)
                } catch (error) {
                  alert(`Health Check Error: ${error}`)
                }
              }}
              className="mr-2 rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
            >
              Test Health API
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/auth/check-session")
                  const data = await response.json()
                  alert(`Auth Check: ${JSON.stringify(data, null, 2)}`)
                } catch (error) {
                  alert(`Auth Check Error: ${error}`)
                }
              }}
              className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
            >
              Test Auth API
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
