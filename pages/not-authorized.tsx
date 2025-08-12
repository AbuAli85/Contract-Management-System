import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotAuthorizedPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md'>
        <Card>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <Shield className='h-6 w-6 text-red-600' />
            </div>
            <CardTitle className='text-2xl'>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center text-sm text-muted-foreground'>
              <p>
                Please log in with appropriate permissions to access this
                resource.
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              <Button asChild>
                <Link href='/en/dashboard'>
                  <Home className='mr-2 h-4 w-4' />
                  Go to Dashboard
                </Link>
              </Button>

              <Button variant='outline' asChild>
                <Link href='/auth/login'>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to Login
                </Link>
              </Button>
            </div>

            <div className='text-center text-xs text-muted-foreground'>
              <p>
                If you believe this is an error, please contact your
                administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
