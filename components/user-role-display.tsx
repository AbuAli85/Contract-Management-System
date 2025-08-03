"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-service"
import { useUserProfile } from "@/hooks/use-user-profile"
import { hasRolePermission, canPerformAdminActions, canPerformUserActions, getRoleDisplay } from "@/lib/role-hierarchy"
import { 
  Crown, 
  User, 
  Shield, 
  Settings, 
  Users, 
  FileText,
  Building2,
  BarChart3
} from "lucide-react"

export function UserRoleDisplay() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  
  if (!user || !profile) {
    return null
  }

  const currentRole = profile.role || 'user'
  const roleInfo = getRoleDisplay(currentRole)
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Role & Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Role Display */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile.display_name || user.email?.split('@')[0] || 'User'}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <Badge variant="default" className="text-sm px-3 py-1">
            {roleInfo.displayText}
          </Badge>
        </div>

        {/* Role Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admin Capabilities */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-red-600" />
              <h4 className="font-medium">Admin Capabilities</h4>
              <Badge variant={roleInfo.canDoAdmin ? "default" : "secondary"}>
                {roleInfo.canDoAdmin ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${roleInfo.canDoAdmin ? 'text-green-600' : 'text-gray-400'}`}>
                <Users className="h-3 w-3" />
                <span>Manage Users</span>
              </div>
              <div className={`flex items-center gap-2 ${roleInfo.canDoAdmin ? 'text-green-600' : 'text-gray-400'}`}>
                <Settings className="h-3 w-3" />
                <span>System Settings</span>
              </div>
              <div className={`flex items-center gap-2 ${roleInfo.canDoAdmin ? 'text-green-600' : 'text-gray-400'}`}>
                <BarChart3 className="h-3 w-3" />
                <span>View All Reports</span>
              </div>
            </div>
          </div>

          {/* User Capabilities */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">User Capabilities</h4>
              <Badge variant={roleInfo.canDoUser ? "default" : "secondary"}>
                {roleInfo.canDoUser ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${roleInfo.canDoUser ? 'text-green-600' : 'text-gray-400'}`}>
                <FileText className="h-3 w-3" />
                <span>Create Contracts</span>
              </div>
              <div className={`flex items-center gap-2 ${roleInfo.canDoUser ? 'text-green-600' : 'text-gray-400'}`}>
                <Building2 className="h-3 w-3" />
                <span>Manage Own Data</span>
              </div>
              <div className={`flex items-center gap-2 ${roleInfo.canDoUser ? 'text-green-600' : 'text-gray-400'}`}>
                <BarChart3 className="h-3 w-3" />
                <span>View Own Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accessible Roles */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Accessible Role Levels</h4>
          <div className="flex flex-wrap gap-2">
            {roleInfo.accessible.map((role) => (
              <Badge 
                key={role} 
                variant={role === currentRole ? "default" : "outline"}
                className="text-xs"
              >
                {role}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            You can perform actions available to these roles and below
          </p>
        </div>

        {/* Action Buttons Based on Role */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {roleInfo.canDoUser && (
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              User Dashboard
            </Button>
          )}
          {roleInfo.canDoAdmin && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
          {hasRolePermission(currentRole, 'manager') && (
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Team Management
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for easy role checking in components
export function useRolePermissions() {
  const { profile } = useUserProfile()
  const currentRole = profile?.role || 'user'
  
  return {
    currentRole,
    isAdmin: canPerformAdminActions(currentRole),
    isUser: canPerformUserActions(currentRole),
    canManageUsers: hasRolePermission(currentRole, 'admin'),
    canManageTeam: hasRolePermission(currentRole, 'manager'),
    canModerate: hasRolePermission(currentRole, 'moderator'),
    hasRole: (role: string) => hasRolePermission(currentRole, role),
    roleInfo: getRoleDisplay(currentRole)
  }
}
