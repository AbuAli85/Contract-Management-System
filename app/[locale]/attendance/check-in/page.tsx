'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AttendanceCheckInRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';

  useEffect(() => {
    // Redirect to attendance page if no code is provided
    router.replace(`/${locale}/attendance`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Invalid Check-In Link</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This check-in link is invalid. Please use a valid attendance link provided by your manager.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

