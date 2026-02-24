'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import PromoterFormProfessional from '@/components/promoter-form-professional';

export default function AddNewPromoterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = () => {
    setIsSubmitting(false);
    // Redirect back to promoters list after successful submission
    router.push(`/${locale}/promoters`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/promoters`);
  };

  // Handle case where locale is undefined during build
  if (!locale) {
    return (
      <div className='min-h-screen bg-background px-4 py-8 sm:py-12'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background px-4 py-8 sm:py-12'>
      <div className='mx-auto max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          {/* Breadcrumb */}
          <nav className='mb-4 flex items-center gap-1 text-sm text-muted-foreground'>
            <button
              onClick={() => router.push(`/${locale}/promoters`)}
              className='hover:text-foreground transition-colors'
            >
              Promoters
            </button>
            <span>/</span>
            <span className='text-foreground font-medium'>Add New</span>
          </nav>

          <div className='flex items-center gap-3'>
            <PlusCircle className='h-8 w-8 text-primary' />
            <div>
              <h1 className='text-3xl font-bold'>Add New Promoter</h1>
              <p className='text-muted-foreground'>
                Enter promoter details to add them to the system
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PlusCircle className='h-5 w-5' />
              Promoter Information
            </CardTitle>
            <CardDescription>
              Fill in the promoter's personal and document information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromoterFormProfessional
              onFormSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
