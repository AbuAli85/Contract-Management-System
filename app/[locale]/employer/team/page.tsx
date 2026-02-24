import { TeamManagementDashboard } from '@/components/employer/team-management-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Management | SmartPro Portal',
  description:
    'Manage your team members, permissions, attendance, tasks, and targets',
};

export default function EmployerTeamPage() {
  return (
    <div className='min-h-screen bg-gray-50/50 dark:bg-gray-950/50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl'>
        <TeamManagementDashboard />
      </div>
    </div>
  );
}
