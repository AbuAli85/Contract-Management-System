import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Reports | HR Management',
  description: 'HR analytics and reports',
};

export default function HRReportsPage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center py-16'>
          <h1 className='text-3xl font-bold mb-4'>HR Reports</h1>
          <p className='text-muted-foreground mb-8'>
            This feature is coming soon. You'll be able to generate
            comprehensive HR reports here.
          </p>
          <div className='bg-muted rounded-lg p-6'>
            <p className='text-sm text-muted-foreground'>
              This page will include:
            </p>
            <ul className='mt-4 text-left space-y-2 text-sm text-muted-foreground max-w-md mx-auto'>
              <li>• Employee attendance reports</li>
              <li>• Leave utilization analytics</li>
              <li>• Document compliance reports</li>
              <li>• Assignment and deployment statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
