'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Shield, User, Crown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { useToast } from '@/hooks/use-toast'
import { RoleRefreshButton } from './role-refresh-button'

interface RoleManagementStatusProps {
  compact?: boolean
  showPermissions?: boolean
  className?: string
}

export function RoleManagementStatus({ 
  compact = false, 
  showPermissions = false,
  className = ''
}: RoleManagementStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const permissions = usePermissions()
  const { user } = useAuth()
  const { toast } = useToast()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'user':
        return <User className="h-4 w-4 text-green-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getPermissionStatus = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    )
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {getRoleIcon(permissions.role)}
          <Badge variant="outline" className="text-xs">
            {permissions.role}
          </Badge>
        </div>
        <RoleRefreshButton variant="ghost" size="sm" compact />
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRoleIcon(permissions.role)}
              <CardTitle className="text-lg">Role Status</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <RoleRefreshButton variant="outline" size="sm" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                Details
              </Button>
            </div>
          </div>
          <CardDescription>
            Current role: {permissions.role} | User: {user?.email}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRoleIcon(permissions.role)}
            <CardTitle>Role Management Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <RoleRefreshButton variant="outline" size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </Button>
          </div>
        </div>
        <CardDescription>
          Detailed role and permission information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            User Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>User ID: <Badge variant="outline">{user?.id?.substring(0, 8)}...</Badge></div>
            <div>Email: <Badge variant="outline">{user?.email}</Badge></div>
            <div>Current Role: <Badge variant="default">{permissions.role}</Badge></div>
            <div>Roles Count: <Badge variant="outline">{permissions.roles.length}</Badge></div>
          </div>
        </div>

        <Separator />

        {/* Contract Permissions */}
        {showPermissions && (
          <>
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
          </>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Quick Actions</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  toast({
                    title: 'Cache Cleared',
                    description: 'Browser cache has been cleared. Please refresh the page.',
                  })
                }
              }}
            >
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>

        {/* Status Information */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Status Information
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Loading: {permissions.isLoading ? 'Yes' : 'No'}</div>
            <div>Initialized: {permissions.isLoading ? 'No' : 'Yes'}</div>
            <div>Timestamp: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 