"use client"

import { useAuth } from "@/lib/auth-service"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function TestAuthPage() {
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "en"
  const { user, profile, roles, loading, mounted } = useAuth()

  useEffect(() => {
    console.log("🔍 Test Auth Page Debug:", {
      user: user?.email,
      profile: profile?.full_name,
      roles,
      loading,
      mounted,
    })
  }, [user, profile, roles, loading, mounted])

  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p>Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Authentication Test Page</h1>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium text-gray-900">Authentication State</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>User:</strong> {user ? user.email : "Not logged in"}
                </p>
                <p>
                  <strong>Profile:</strong> {profile ? profile.full_name : "No profile"}
                </p>
                <p>
                  <strong>Roles:</strong> {roles.length > 0 ? roles.join(", ") : "No roles"}
                </p>
                <p>
                  <strong>Loading:</strong> {loading ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Mounted:</strong> {mounted ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium text-gray-900">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/auth/login"
                  className="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
                >
                  Go to Login
                </a>
                <a
                  href={`/${locale}/dashboard`}
                  className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
                >
                  Go to Dashboard
                </a>
                <a
                  href="/auth/profile"
                  className="block w-full rounded bg-purple-600 px-4 py-2 text-center text-white hover:bg-purple-700"
                >
                  Go to Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
