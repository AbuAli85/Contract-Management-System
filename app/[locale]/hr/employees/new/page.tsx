import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Employee | HR Management',
  description: 'Add a new employee to the system',
};

export default function AddEmployeePage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center py-16'>
          <h1 className='text-3xl font-bold mb-4'>Add New Employee</h1>
          <p className='text-muted-foreground mb-8'>
            This feature is coming soon. You'll be able to add new employees
            here.
          </p>
          <div className='bg-muted rounded-lg p-6'>
            <p className='text-sm text-muted-foreground'>
              This page will include:
            </p>
            <ul className='mt-4 text-left space-y-2 text-sm text-muted-foreground max-w-md mx-auto'>
              <li>• Employee registration form</li>
              <li>• Document upload</li>
              <li>• Assignment to clients</li>
              <li>• Initial contract setup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
