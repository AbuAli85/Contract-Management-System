import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave Requests | HR Management',
  description: 'Manage employee leave requests',
};

export default function LeaveRequestsPage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center py-16'>
          <h1 className='text-3xl font-bold mb-4'>Leave Requests</h1>
          <p className='text-muted-foreground mb-8'>
            This feature is coming soon. You'll be able to manage employee leave
            requests here.
          </p>
          <div className='bg-muted rounded-lg p-6'>
            <p className='text-sm text-muted-foreground'>
              This page will include:
            </p>
            <ul className='mt-4 text-left space-y-2 text-sm text-muted-foreground max-w-md mx-auto'>
              <li>• View pending leave requests</li>
              <li>• Approve or reject leave applications</li>
              <li>• Track leave balances</li>
              <li>• Generate leave reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
