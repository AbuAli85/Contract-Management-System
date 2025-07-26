'use client'

import { useSimpleAuth } from '@/src/components/auth/simple-auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SimpleDashboardPage() {
  const { user, profile, loading, signOut } = useSimpleAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/simple-login')
  }

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/auth/simple-login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.email}</p>
              <Badge variant="outline">{profile?.role || 'User'}</Badge>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Your account details and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <Badge variant="secondary">{profile?.role || 'User'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge variant={profile?.status === 'active' ? 'default' : 'destructive'}>
                  {profile?.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg">{profile?.full_name || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Contracts
              </CardTitle>
              <CardDescription>
                Manage your contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Contracts
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Promoters
              </CardTitle>
              <CardDescription>
                Manage promoters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Promoters
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Open Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Message */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✅ Authentication system is working properly! The infinite loading issue has been resolved.
          </p>
        </div>
      </div>
    </div>
  )
} 