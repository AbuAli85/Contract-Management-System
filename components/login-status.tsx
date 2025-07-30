"use client"

import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, User, Shield, Crown, AlertCircle, CheckCircle } from "lucide-react"
import { useState } from "react"

export function LoginStatus() {
  const { user, roles: authRoles, loading: authLoading, forceRefreshRole } = useAuth()
  const { roles: userRoles, isLoading: rbacLoading } = usePermissions()
  const [refreshing, setRefreshing] = useState(false)

  const handleForceRefresh = async () => {
    setRefreshing(true)
    try {
      await forceRefreshRole()
    } finally {
      setRefreshing(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "user":
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  if (authLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Authentication...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Please wait while we authenticate you...</div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Not Logged In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Please log in to access the system.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Login Status</span>
          <Button variant="outline" size="sm" onClick={handleForceRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Login Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Login Status</div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Logged In</span>
          </div>
          <div className="text-sm text-gray-600">{user.email}</div>
          <div className="text-xs text-gray-500">ID: {user.id}</div>
        </div>

        {/* Auth Provider Role */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Auth Provider Role</div>
          <div className="flex items-center gap-2">
            {authRoles[0] ? (
              <>
                {getRoleIcon(authRoles[0])}
                <Badge className={getRoleColor(authRoles[0])}>{authRoles[0]}</Badge>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading role...</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">Source: AuthProvider</div>
        </div>

        {/* RBAC Provider Roles */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">RBAC Provider Roles</div>
          <div className="flex flex-wrap gap-2">
            {rbacLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading roles...</span>
              </div>
            ) : userRoles.length > 0 ? (
              userRoles.map((role: string, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  {getRoleIcon(role)}
                  <Badge className={getRoleColor(role)}>{role}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No roles assigned</div>
            )}
          </div>
          <div className="text-xs text-gray-500">Source: RBACProvider</div>
        </div>

        {/* Status Summary */}
        <div className="border-t pt-2">
          <div className="text-sm font-medium text-gray-700">Status</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Auth Loading: {authLoading ? "Yes" : "No"}</div>
            <div>RBAC Loading: {rbacLoading ? "Yes" : "No"}</div>
            <div>Roles Match: {authRoles[0] === userRoles[0] ? "✅ Yes" : "❌ No"}</div>
            <div>Has Admin: {userRoles.includes("admin") ? "✅ Yes" : "❌ No"}</div>
            <div>Role Loaded: {authRoles[0] ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
