'use client';

/**
 * Simple Promoter Form Example
 *
 * This is a minimal example showing how to use the PromoterFormComprehensive component
 * for creating a new promoter with basic required fields.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PromoterFormComprehensive } from './promoter-form-comprehensive';
import type { PromoterFormData } from '@/lib/schemas/promoter-form-schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

export function PromoterFormSimpleExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PromoterFormData) => {
    setIsSubmitting(true);

    try {
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...data,
        id_card_expiry_date: data.id_card_expiry_date?.toISOString(),
        passport_expiry_date: data.passport_expiry_date?.toISOString(),
        visa_expiry_date: data.visa_expiry_date?.toISOString(),
        work_permit_expiry_date: data.work_permit_expiry_date?.toISOString(),
        date_of_birth: data.date_of_birth?.toISOString(),
      };

      // Make API call
      const response = await fetch('/api/promoters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create promoter');
      }

      toast.success('Promoter created successfully!');

      // Optional: Redirect or reset form
      // router.push('/manage-promoters');
    } catch (error) {
      console.error('Error creating promoter:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create promoter'
      );
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Optional: Navigate away or clear form
    // router.back();
  };

  return (
    <div className='container max-w-5xl mx-auto py-8'>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Simple Promoter Form Example</CardTitle>
          <CardDescription>
            This example demonstrates the basic usage of the comprehensive
            promoter form component. The form includes all required fields from
            the database schema with proper validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm'>
            <h4 className='font-medium'>Key Features:</h4>
            <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
              <li>Multi-section form with 10 organized sections</li>
              <li>Real-time validation using Zod + React Hook Form</li>
              <li>Progress tracking across sections</li>
              <li>Date picker integration for all date fields</li>
              <li>
                Business rule validation (e.g., ID expiry must be in future)
              </li>
              <li>Responsive design with animations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <PromoterFormComprehensive
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode='create'
      />
    </div>
  );
}
