'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ServiceForm } from '@/components/services/service-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

interface Provider {
  id: string;
  full_name: string;
}

export default function NewServicePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<NewServicePageSkeleton />}>
        <NewServicePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function NewServicePageContent() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'provider')
          .order('full_name');

        if (error) {
          console.error('Error fetching providers:', error);
          setError('Failed to load providers');
        } else if (data) {
          setProviders(data);
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (loading) {
    return <NewServicePageSkeleton />;
  }

  if (error) {
    return (
      <div className='container mx-auto p-8 max-w-4xl'>
        <Card>
          <CardContent className='p-8 text-center'>
            <div className='text-red-600 mb-4'>
              <h2 className='text-xl font-semibold'>Error Loading Providers</h2>
              <p>{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-8 max-w-4xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Create New Service</h1>
        <p className='text-muted-foreground'>
          Add a new service to the system. The service will be sent for
          approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>
            Fill in the service information below. The service will be created
            and sent for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm providers={providers} />
        </CardContent>
      </Card>
    </div>
  );
}

function NewServicePageSkeleton() {
  return (
    <div className='container mx-auto p-8 max-w-4xl'>
      <div className='mb-8'>
        <div className='h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse' />
        <div className='h-4 bg-gray-200 rounded w-2/3 animate-pulse' />
      </div>

      <Card>
        <CardHeader>
          <div className='h-6 bg-gray-200 rounded w-1/4 mb-2 animate-pulse' />
          <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse' />
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-24 animate-pulse' />
              <div className='h-10 bg-gray-200 rounded animate-pulse' />
            </div>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-20 animate-pulse' />
              <div className='h-10 bg-gray-200 rounded animate-pulse' />
            </div>
            <div className='h-10 bg-gray-200 rounded w-32 animate-pulse' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
