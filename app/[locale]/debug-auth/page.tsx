'use client'

import { useAuth } from '@/src/components/auth/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, User, Shield, Key } from 'lucide-react'

export default function DebugAuthPage() {
  const { 
    user, 
    profile, 
    roles, 
    session, 
    loading, 
    mounted,
    hasRole,
    hasPermission,
    forceRefreshRole,
    refreshSession
  } = useAuth()

  const handleRefreshRole = async () => {
    await forceRefreshRole()
  }

  const handleRefreshSession = async () => {
    await refreshSession()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-muted-foreground mt-2">
            Development tool to inspect authentication state
          </p>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium">Loading</p>
                <Badge variant={loading ? "default" : "secondary"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Mounted</p>
                <Badge variant={mounted ? "default" : "secondary"}>
                  {mounted ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Authenticated</p>
                <Badge variant={user ? "default" : "secondary"}>
                  {user ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Profile Loaded</p>
                <Badge variant={profile ? "default" : "secondary"}>
                  {profile ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Email Verified:</span> {user.email_confirmed_at ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Created At:</span> {user.created_at}
                </div>
                <div>
                  <span className="font-medium">Last Sign In:</span> {user.last_sign_in_at || "Never"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Full Name:</span> {profile.full_name || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Role:</span> 
                  <Badge className="ml-2">{profile.role}</Badge>
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge variant="outline" className="ml-2">{profile.status}</Badge>
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {profile.phone || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Department:</span> {profile.department || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Position:</span> {profile.position || "Not set"}
                </div>
                {profile.permissions && profile.permissions.length > 0 && (
                  <div>
                    <span className="font-medium">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roles and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Roles:</h4>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((role, index) => (
                      <Badge key={index} variant="default">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Role Tests:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['admin', 'manager', 'user', 'viewer'].map((role) => (
                    <div key={role} className="text-center">
                      <p className="text-sm">{role}</p>
                      <Badge variant={hasRole(role) ? "default" : "secondary"}>
                        {hasRole(role) ? "Yes" : "No"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Permission Tests:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['users.view', 'contracts.create', 'dashboard.view', 'settings.edit'].map((permission) => (
                    <div key={permission} className="text-center">
                      <p className="text-sm">{permission}</p>
                      <Badge variant={hasPermission(permission) ? "default" : "secondary"}>
                        {hasPermission(permission) ? "Yes" : "No"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Information */}
        {session && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Access Token:</span> 
                  <div className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                    {session.access_token.substring(0, 50)}...
                  </div>
                </div>
                <div>
                  <span className="font-medium">Refresh Token:</span> 
                  <div className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                    {session.refresh_token.substring(0, 50)}...
                  </div>
                </div>
                <div>
                  <span className="font-medium">Expires At:</span> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Token Type:</span> {session.token_type}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Debug actions to test authentication functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleRefreshRole} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Role
              </Button>
              <Button onClick={handleRefreshSession} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 