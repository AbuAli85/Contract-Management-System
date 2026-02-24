import type { Metadata } from 'next';
import { AdminPermissionManager } from '@/components/admin/admin-permission-manager';

export const metadata: Metadata = {
  title: 'Permission Management | Admin',
  description:
    'Manage user roles and permissions for the Promoter Intelligence Hub',
};

export default function AdminPermissionsPage() {
  return (
    <div className='container mx-auto py-6 px-4'>
      <AdminPermissionManager />
    </div>
  );
}
