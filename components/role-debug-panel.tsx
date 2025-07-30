"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  RefreshCw,
  Shield,
  User,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { useToast } from "@/hooks/use-toast"

export function RoleDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const permissions = usePermissions()
  const { user } = useAuth()
  const { toast } = useToast()

  const handleRefreshRole = async () => {
    setIsRefreshing(true)
    try {
      const newRole = await permissions.forceRefresh()
      toast({
        title: "Role Refreshed",
        description: `Role updated to: ${newRole}`,
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh role",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-yellow-500" />
      case "manager":
        return <User className="h-4 w-4 text-blue-500" />
      case "user":
        return <User className="h-4 w-4 text-green-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getPermissionStatus = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  if (!isExpanded) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">Role Debug Panel</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
              Expand
            </Button>
          </div>
          <CardDescription>
            Current role: {permissions.role} | User: {user?.email}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Role Debug Panel</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshRole} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Role
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              Collapse
            </Button>
          </div>
        </div>
        <CardDescription>Detailed role and permission information for debugging</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium">
            <User className="h-4 w-4" />
            User Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              User ID: <Badge variant="outline">{user?.id?.substring(0, 8)}...</Badge>
            </div>
            <div>
              Email: <Badge variant="outline">{user?.email}</Badge>
            </div>
            <div>
              Current Role: <Badge variant="default">{permissions.role}</Badge>
            </div>
            <div>
              Roles Count: <Badge variant="outline">{permissions.roles.length}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Role Sources */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium">
            <Database className="h-4 w-4" />
            Role Sources
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span>Primary Role:</span>
              <div className="flex items-center gap-1">
                {getRoleIcon(permissions.role)}
                <Badge variant="default">{permissions.role}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>All Roles:</span>
              <div className="flex gap-1">
                {permissions.roles.map((role, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {getRoleIcon(role)}
                    <Badge variant="outline">{role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contract Permissions */}
        <div className="space-y-2">
          <h4 className="font-medium">Contract Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canCreateContract())}
              <span>Create Contract</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canEditContract())}
              <span>Edit Contract</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canDeleteContract())}
              <span>Delete Contract</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canExportContracts())}
              <span>Export Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canGenerateContract())}
              <span>Generate Contract</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Promoter Permissions */}
        <div className="space-y-2">
          <h4 className="font-medium">Promoter Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.can("promoter:create"))}
              <span>Create Promoter</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canEditPromoter())}
              <span>Edit Promoter</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canDeletePromoter())}
              <span>Delete Promoter</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canExportPromoters())}
              <span>Export Promoters</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Party Permissions */}
        <div className="space-y-2">
          <h4 className="font-medium">Party Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.can("party:create"))}
              <span>Create Party</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canEditParty())}
              <span>Edit Party</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canDeleteParty())}
              <span>Delete Party</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canExportParties())}
              <span>Export Parties</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* System Permissions */}
        <div className="space-y-2">
          <h4 className="font-medium">System Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canAccessSettings())}
              <span>Access Settings</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canAccessAnalytics())}
              <span>Access Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canAccessAuditLogs())}
              <span>Access Audit Logs</span>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatus(permissions.canManageUsers())}
              <span>Manage Users</span>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <Separator />
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Debug Information
          </h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Loading: {permissions.isLoading ? "Yes" : "No"}</div>
            <div>Initialized: {permissions.isLoading ? "No" : "Yes"}</div>
            <div>Timestamp: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
