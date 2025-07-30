"use client"

import { useRBAC } from "@/src/components/auth/rbac-provider"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, User, Loader2, CheckCircle, XCircle } from "lucide-react"

export function PermanentRoleStatus() {
  const { user } = useAuth()
  const { userRoles, isLoading } = useRBAC()
  const permanentRole = userRoles[0] || null
  const isInitialized = !isLoading

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Permanent Role Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Not logged in</p>
        </CardContent>
      </Card>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />
      case "manager":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Permanent Role Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">User:</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">User ID:</span>
          <span className="font-mono text-sm text-muted-foreground">{user.id}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Permanent Role:</span>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : permanentRole ? (
            <Badge className={`flex items-center gap-1 ${getRoleColor(permanentRole)}`}>
              {getRoleIcon(permanentRole)}
              {permanentRole}
            </Badge>
          ) : (
            <Badge className="flex items-center gap-1 border-gray-300 bg-gray-100 text-gray-800">
              <User className="h-3 w-3" />
              No Role
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-sm text-green-600">Initialized</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-sm text-red-600">Not Initialized</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Loading:</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Yes</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-sm text-green-600">No</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Storage Key:</span>
          <span className="font-mono text-sm text-muted-foreground">permanent_role_{user.id}</span>
        </div>

        <div className="border-t pt-2">
          <p className="text-xs text-muted-foreground">
            This role is stored permanently in localStorage and persists across all sessions and
            page refreshes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
