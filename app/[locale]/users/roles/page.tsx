import { Suspense } from 'react'
import { Loader2, Shield, Users, UserCheck, UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Loading fallback
function RolesPageLoading() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and system permissions.
          </p>
        </div>
      </div>
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 pt-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin mr-2" /> Loading roles and permissions...
          </div>
        </div>
      </div>
    </div>
  )
}

function RolesPageContent() {
  const roles = [
    {
      name: 'Admin',
      description: 'Full system access with all permissions',
      icon: Shield,
      color: 'bg-red-100 text-red-800 border-red-200',
      permissions: ['All permissions'],
      users: 1
    },
    {
      name: 'Manager',
      description: 'User management and contract approval',
      icon: UserCog,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      permissions: ['User management', 'Contract approval', 'Analytics'],
      users: 2
    },
    {
      name: 'User',
      description: 'Basic contract operations',
      icon: Users,
      color: 'bg-green-100 text-green-800 border-green-200',
      permissions: ['View contracts', 'Create contracts', 'Edit contracts'],
      users: 8
    },
    {
      name: 'Viewer',
      description: 'Read-only access',
      icon: UserCheck,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      permissions: ['View contracts', 'View analytics'],
      users: 1
    }
  ]

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and system permissions.
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => {
          const IconComponent = role.icon
          return (
            <Card key={role.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={role.color}>
                    {role.users} users
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {role.description}
                </p>
                <div className="space-y-1">
                  {role.permissions.map((permission, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      • {permission}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Permissions Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <h4 className="font-medium">User Management</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View users</div>
                <div>• Create users</div>
                <div>• Edit users</div>
                <div>• Delete users</div>
                <div>• Assign roles</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Promoter Management</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View promoters</div>
                <div>• Add promoters</div>
                <div>• Edit promoters</div>
                <div>• Delete promoters</div>
                <div>• Bulk delete promoters</div>
                <div>• Export promoters</div>
                <div>• Archive promoters</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Party Management</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View parties</div>
                <div>• Add parties</div>
                <div>• Edit parties</div>
                <div>• Delete parties</div>
                <div>• Bulk delete parties</div>
                <div>• Export parties</div>
                <div>• Archive parties</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Contract Management</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View contracts</div>
                <div>• Create contracts</div>
                <div>• Edit contracts</div>
                <div>• Delete contracts</div>
                <div>• Approve contracts</div>
                <div>• Export contracts</div>
                <div>• Archive contracts</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Dashboard & Analytics</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View dashboard</div>
                <div>• View analytics</div>
                <div>• Generate reports</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">System Administration</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• View settings</div>
                <div>• Edit settings</div>
                <div>• View logs</div>
                <div>• Create backups</div>
                <div>• Restore system</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RolesPage() {
  return (
    <Suspense fallback={<RolesPageLoading />}>
      <RolesPageContent />
    </Suspense>
  )
} 