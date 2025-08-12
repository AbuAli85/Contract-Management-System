import { Metadata } from 'next';
import UserManagementDashboard from '@/components/user-management/UserManagementDashboard';
import { EnhancedRBAC } from '@/lib/rbac/enhancedRBAC';

export const metadata: Metadata = {
  title: 'User Management - Contract Management System',
  description: 'Comprehensive user management with role-based access control',
};

export default function UserManagementPage() {
  return (
    <EnhancedRBAC
      requiredPermissions={['users.read']}
      showUnauthorized={true}
    >
      <div className="container mx-auto py-6 px-4">
        <UserManagementDashboard />
      </div>
    </EnhancedRBAC>
  );
}
