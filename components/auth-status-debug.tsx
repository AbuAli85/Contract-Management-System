"use client"

import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, User, Shield } from "lucide-react"

export function AuthStatusDebug() {
  const { user, profile, roles, loading, mounted, signOut } = useAuth()

  if (!mounted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Auth Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Auth Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading authentication...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Auth Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Not Authenticated</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            User is not logged in. Please sign in to access the application.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Auth Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default">Authenticated</Badge>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Email:</span> {user.email}
          </div>
          {profile && (
            <>
              <div className="text-sm">
                <span className="font-medium">Name:</span> {profile.full_name || 'N/A'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Role:</span> {profile.role}
              </div>
              <div className="text-sm">
                <span className="font-medium">Created:</span> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </>
          )}
          <div className="text-sm">
            <span className="font-medium">Roles:</span> {roles.join(', ') || 'None'}
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => signOut()}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  )
} 