"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRoleDisplay, useRolePermissions } from "@/components/user-role-display"
import { updateUserRole, ROLE_HIERARCHY, type UserRole } from "@/lib/role-hierarchy"
import { useAuth } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { 
  Crown, 
  Shield, 
  Users, 
  User, 
  Eye,
  Settings,
  Briefcase,
  Monitor,
  RefreshCw
} from "lucide-react"

export default function RoleTestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')
  const [isUpdating, setIsUpdating] = useState(false)
  const rolePermissions = useRolePermissions()

  const handleRoleChange = async () => {
    if (!user?.id) return

    setIsUpdating(true)
    try {
      const result = await updateUserRole(user.id, selectedRole)
      
      if (result.success) {
        toast({
          title: "Role Updated",
          description: `Role successfully changed to ${selectedRole}`,
        })
        // Refresh the page to update the role display
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update role",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const roleOptions = Object.keys(ROLE_HIERARCHY) as UserRole[]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Hierarchy System Demo</h1>
          <p className="text-gray-600 mt-2">
            Test how users can have both admin and user capabilities simultaneously
          </p>
        </div>
      </div>

      {/* Current Role Display */}
      <UserRoleDisplay />

      {/* Role Testing Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Role Testing Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Change Role (for testing):
              </label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {role === 'super_admin' && <Crown className="h-4 w-4 text-purple-600" />}
                        {role === 'admin' && <Shield className="h-4 w-4 text-red-600" />}
                        {role === 'manager' && <Briefcase className="h-4 w-4 text-blue-600" />}
                        {role === 'moderator' && <Monitor className="h-4 w-4 text-green-600" />}
                        {role === 'user' && <User className="h-4 w-4 text-gray-600" />}
                        {role === 'guest' && <Eye className="h-4 w-4 text-gray-400" />}
                        {role} (Level {ROLE_HIERARCHY[role]})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleRoleChange}
              disabled={isUpdating || selectedRole === rolePermissions.currentRole}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Apply Role"
              )}
            </Button>
          </div>

          {/* Role Hierarchy Explanation */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">How Role Hierarchy Works:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• <strong>Higher roles inherit all lower role permissions</strong></li>
              <li>• An "admin" user can do everything a "user" can do, plus admin tasks</li>
              <li>• This means admins are both "admin" AND "user" simultaneously</li>
              <li>• Role levels: Super Admin (5) → Admin (4) → Manager (3) → Moderator (2) → User (1) → Guest (0)</li>
            </ul>
          </div>

          {/* Permission Testing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Admin Actions Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  size="sm" 
                  variant={rolePermissions.isAdmin ? "default" : "secondary"}
                  disabled={!rolePermissions.isAdmin}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
                <Button 
                  size="sm" 
                  variant={rolePermissions.canManageUsers ? "default" : "secondary"}
                  disabled={!rolePermissions.canManageUsers}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">User Actions Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  size="sm" 
                  variant={rolePermissions.isUser ? "default" : "secondary"}
                  disabled={!rolePermissions.isUser}
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  User Dashboard
                </Button>
                <Button 
                  size="sm" 
                  variant={rolePermissions.isUser ? "default" : "secondary"}
                  disabled={!rolePermissions.isUser}
                  className="w-full"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  My Tasks
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Permissions Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current User Capabilities:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className={`p-2 rounded ${rolePermissions.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Admin: {rolePermissions.isAdmin ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded ${rolePermissions.isUser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                User: {rolePermissions.isUser ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded ${rolePermissions.canManageTeam ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Manager: {rolePermissions.canManageTeam ? '✓' : '✗'}
              </div>
              <div className={`p-2 rounded ${rolePermissions.canModerate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Moderator: {rolePermissions.canModerate ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="space-y-2">
              <div># Current Role: <span className="text-yellow-400">{rolePermissions.currentRole}</span></div>
              <div># Can do Admin tasks: <span className="text-blue-400">{rolePermissions.isAdmin.toString()}</span></div>
              <div># Can do User tasks: <span className="text-blue-400">{rolePermissions.isUser.toString()}</span></div>
              <div># Display Text: <span className="text-white">"{rolePermissions.roleInfo?.displayText}"</span></div>
              <div className="mt-4 text-gray-400"># Usage in components:</div>
              <div>const {'{ isAdmin, isUser }'} = useRolePermissions()</div>
              <div>if (isAdmin && isUser) {'{'}</div>
              <div>  {'// User has both admin and user capabilities'}</div>
              <div>{'}'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
