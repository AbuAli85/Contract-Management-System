'use client'

import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { useEffect, useState } from 'react'

export default function AuthDebugPage() {
  const { user, loading, mounted, profile, session, roles } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-purple-600">🔐 Auth Debug Page</h1>
        <p className="text-muted-foreground">Debugging authentication state</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">Authentication State:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Loading:</strong> {loading ? '🔄 True' : '✅ False'}</p>
            <p><strong>Mounted:</strong> {mounted ? '✅ True' : '❌ False'}</p>
            <p><strong>User:</strong> {user ? '✅ Logged In' : '❌ Not Logged In'}</p>
            <p><strong>Session:</strong> {session ? '✅ Active' : '❌ None'}</p>
          </div>
          <div>
            <p><strong>Profile:</strong> {profile ? '✅ Loaded' : '❌ None'}</p>
            <p><strong>Roles:</strong> {roles.length > 0 ? roles.join(', ') : 'None'}</p>
            <p><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">User Information:</h2>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
            {profile && (
              <>
                <p><strong>Full Name:</strong> {profile.full_name}</p>
                <p><strong>Role:</strong> {profile.role}</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">Debug Information:</h2>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• If loading is true and mounted is false, auth is initializing</li>
          <li>• If loading is false and mounted is true, auth is ready</li>
          <li>• If user is null but mounted is true, user is not logged in</li>
          <li>• If user exists, authentication is successful</li>
        </ul>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          This page helps diagnose authentication loading issues.
        </p>
      </div>
    </div>
  )
} 