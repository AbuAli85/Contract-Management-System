import { EmployerEmployeeAlignment } from '@/components/hr/employer-employee-alignment';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer-Employee Alignment | HR Management',
  description:
    'Comprehensive view of employees, assignments, tasks, and targets',
};

export default function AlignmentPage() {
  return (
    <div className='container mx-auto py-6'>
      <EmployerEmployeeAlignment />
    </div>
  );
}
