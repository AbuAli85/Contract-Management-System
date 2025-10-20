import type { Metadata } from 'next';
import { LoginDebugger } from '@/components/login-debugger';

export const metadata: Metadata = {
  title: 'Login Debugger | Contract Management System',
  description: 'Debug login issues and test authentication endpoints',
};

export default function DebugLoginPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto py-8'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>Login Debugger</h1>
          <p className='text-muted-foreground mt-2'>
            Test and debug login functionality
          </p>
        </div>

        <LoginDebugger />
      </div>
    </div>
  );
}
