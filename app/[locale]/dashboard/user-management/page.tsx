import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { UserManagementDashboard } from '@/components/user-management/user-management-dashboard'

// Loading fallback
function UserManagementPageLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="animate-spin mr-2" /> Loading user management...
    </div>
  )
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<UserManagementPageLoading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and permissions
          </p>
        </div>
        <UserManagementDashboard />
      </div>
    </Suspense>
  )
} 