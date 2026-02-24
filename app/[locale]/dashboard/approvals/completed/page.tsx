'use client';

import { useState, useEffect } from 'react';
import { CompletedReviewsList } from '@/components/approval/CompletedReviewsList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CompletedReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center gap-3'>
        <CheckCircle className='h-8 w-8' />
        <div>
          <h1 className='text-3xl font-bold'>Completed Reviews</h1>
          <p className='text-muted-foreground'>
            History of all completed contract reviews
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Completed Reviews</CardTitle>
          <CardDescription>
            View all completed contract reviews and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex h-32 items-center justify-center'>
              <LoadingSpinner />
            </div>
          ) : (
            <CompletedReviewsList />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
