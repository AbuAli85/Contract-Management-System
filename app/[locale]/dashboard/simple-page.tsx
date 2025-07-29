'use client'

import { useParams, use } from 'next/navigation'
import { useAuth } from '@/src/components/auth/simple-auth-provider'

export default function SimpleDashboardPage() {
  const params = useParams()
  const { user, loading, mounted } = useAuth()
  
  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
          <a href={`/${params.locale}/auth/login`} className="text-blue-600 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Dashboard</h1>
      <p className="mb-4">Welcome, {user.email}!</p>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <pre className="text-sm">{JSON.stringify({ id: user.id, email: user.email }, null, 2)}</pre>
      </div>
      <div className="bg-gray-100 p-4 rounded mt-4">
        <h2 className="font-semibold mb-2">Route Parameters:</h2>
        <pre className="text-sm">{JSON.stringify(params, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <a href={`/${params.locale}/dashboard`} className="text-blue-600 hover:underline mr-4">
          Full Dashboard
        </a>
        <a href={`/${params.locale}/auth/login`} className="text-blue-600 hover:underline">
          Logout
        </a>
      </div>
    </div>
  )
}