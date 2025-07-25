import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { UserManagementDashboard } from '@/components/user-management/user-management-dashboard'
import { ProfessionalLayout } from '@/components/professional-layout'

// Loading fallback
function UserManagementPageLoading() {
  return (
    <ProfessionalLayout 
      title="User Management" 
      subtitle="Manage system users, roles, and permissions"
    >
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin mr-2" /> Loading user management...
        </div>
      </div>
    </ProfessionalLayout>
  )
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<UserManagementPageLoading />}>
      <ProfessionalLayout 
        title="User Management" 
        subtitle="Manage system users, roles, and permissions"
      >
        <UserManagementDashboard />
      </ProfessionalLayout>
    </Suspense>
  )
} 