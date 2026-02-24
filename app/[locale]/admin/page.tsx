import type { Metadata } from 'next';
import { AdminDashboardUnified } from '@/components/admin/admin-dashboard-unified';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Control Center',
  description:
    'Admin control center for managing users, roles, and permissions',
};

export default function AdminPage() {
  return (
    <div className='container mx-auto py-6 px-4'>
      <AdminDashboardUnified />
    </div>
  );
}
