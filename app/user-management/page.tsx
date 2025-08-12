import { Metadata } from 'next';
import UserManagementDashboard from '@/components/user-management/UserManagementDashboard';
import { EnhancedRBAC } from '@/lib/rbac/enhancedRBAC';

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Management - Contract Management System',
  description: 'Comprehensive user management with role-based access control',
};

export default function UserManagementPage() {
  return (
    <EnhancedRBAC requiredPermissions={['users.read']} showUnauthorized={true}>
      <div className='container mx-auto py-6 px-4'>
        <UserManagementDashboard />
      </div>
    </EnhancedRBAC>
  );
}
