'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingUpsertForm } from '@/components/booking/booking-upsert-form';
import { Database, Code, TestTube, FileText } from 'lucide-react';

export default function BookingUpsertDemoPage() {
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSuccess = (data: any) => {
    setLastResult(data);
  };

  const examplePayload = {
    service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
    provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
    client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
    scheduled_start: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000
    ).toISOString(),
    scheduled_end: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
    total_price: 25.0,
    currency: 'OMR',
    booking_number: 'BK-TEST-0000000042',
    status: 'pending',
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-4xl font-bold'>Booking Upsert Demo</h1>
        <p className='text-lg text-muted-foreground'>
          Demonstrate Supabase upsert with <code>booking_number</code> as
          conflict target
        </p>
        <div className='flex justify-center gap-2'>
          <Badge variant='default'>
            <Database className='h-3 w-3 mr-1' />
            Supabase
          </Badge>
          <Badge variant='secondary'>Conflict: booking_number</Badge>
          <Badge variant='outline'>ignoreDuplicates: false</Badge>
        </div>
      </div>

      <Tabs defaultValue='interactive' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='interactive'>
            <TestTube className='h-4 w-4 mr-2' />
            Interactive Test
          </TabsTrigger>
          <TabsTrigger value='code'>
            <Code className='h-4 w-4 mr-2' />
            Code Example
          </TabsTrigger>
          <TabsTrigger value='api'>
            <Database className='h-4 w-4 mr-2' />
            API Test
          </TabsTrigger>
          <TabsTrigger value='docs'>
            <FileText className='h-4 w-4 mr-2' />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value='interactive'>
          <div className='space-y-6'>
            <Alert>
              <AlertDescription>
                Use the form below to test booking upsert functionality. The
                same booking number will update the existing record instead of
                creating a duplicate.
              </AlertDescription>
            </Alert>

            <BookingUpsertForm onSuccess={handleSuccess} useAPI={false} />

            {lastResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Upsert Result</CardTitle>
                  <CardDescription>
                    Result from the most recent booking upsert operation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className='bg-gray-100 p-4 rounded text-sm overflow-auto'>
                    {JSON.stringify(lastResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value='code'>
          <Card>
            <CardHeader>
              <CardTitle>Code Implementation</CardTitle>
              <CardDescription>
                Example of the Supabase upsert implementation
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2'>
                  TypeScript Implementation:
                </h3>
                <pre className='bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto'>
                  {`const payload = {
  service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
  provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
  client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
  scheduled_start: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
  scheduled_end: new Date(Date.now() + 4*24*60*60*1000 + 2*60*60*1000).toISOString(),
  total_price: 25.000,
  currency: 'OMR',
  booking_number: 'BK-TEST-0000000042',
  status: 'pending',
};

const { data, error } = await supabase
  .from('bookings')
  .upsert(payload, { 
    onConflict: 'booking_number', 
    ignoreDuplicates: false 
  })
  .select('id, booking_number, status')
  .single();

if (error) throw error;`}
                </pre>
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Key Features:</h3>
                <ul className='list-disc list-inside space-y-1 text-sm'>
                  <li>
                    <code>onConflict: 'booking_number'</code> - Uses
                    booking_number as unique constraint
                  </li>
                  <li>
                    <code>ignoreDuplicates: false</code> - Updates existing
                    records instead of ignoring
                  </li>
                  <li>
                    <code>.single()</code> - Returns single record instead of
                    array
                  </li>
                  <li>Error handling with try/catch blocks</li>
                  <li>Type safety with TypeScript interfaces</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='api'>
          <div className='space-y-6'>
            <Alert>
              <AlertDescription>
                Test the API route approach which provides additional validation
                and error handling.
              </AlertDescription>
            </Alert>

            <BookingUpsertForm onSuccess={handleSuccess} useAPI={true} />

            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Badge variant='default'>POST</Badge>
                  <code className='ml-2'>/api/bookings/upsert</code>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Create or update a booking using the provided data
                  </p>
                </div>

                <div>
                  <Badge variant='secondary'>GET</Badge>
                  <code className='ml-2'>
                    /api/bookings/upsert?booking_number=BK-XXX
                  </code>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Retrieve a booking by its booking number
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='docs'>
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='font-semibold mb-2'>How Upsert Works</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Upsert is a database operation that combines INSERT and
                  UPDATE. It inserts a new record if no conflict occurs, or
                  updates the existing record if a conflict is detected.
                </p>

                <div className='space-y-3'>
                  <div>
                    <h4 className='font-medium'>Conflict Detection</h4>
                    <p className='text-sm text-muted-foreground'>
                      The <code>onConflict</code> parameter specifies which
                      column(s) to check for conflicts. In our case, we use{' '}
                      <code>booking_number</code> as it's unique for each
                      booking.
                    </p>
                  </div>

                  <div>
                    <h4 className='font-medium'>Update Behavior</h4>
                    <p className='text-sm text-muted-foreground'>
                      When <code>ignoreDuplicates: false</code>, existing
                      records are updated with new values. When{' '}
                      <code>ignoreDuplicates: true</code>, conflicts are ignored
                      and no update occurs.
                    </p>
                  </div>

                  <div>
                    <h4 className='font-medium'>Use Cases</h4>
                    <ul className='list-disc list-inside text-sm text-muted-foreground space-y-1'>
                      <li>Importing data without worrying about duplicates</li>
                      <li>
                        Updating existing records or creating new ones in a
                        single operation
                      </li>
                      <li>
                        Maintaining data integrity while allowing bulk
                        operations
                      </li>
                      <li>
                        Implementing "save" functionality that works for both
                        new and existing records
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='font-semibold mb-2'>
                  Database Schema Requirements
                </h3>
                <p className='text-sm text-muted-foreground mb-2'>
                  For upsert to work properly, the conflict target column must
                  have a unique constraint:
                </p>
                <pre className='bg-gray-100 p-3 rounded text-sm'>
                  {`-- In your migration file:
ALTER TABLE bookings 
ADD CONSTRAINT bookings_booking_number_unique 
UNIQUE (booking_number);`}
                </pre>
              </div>

              <div>
                <h3 className='font-semibold mb-2'>Example Test Scenarios</h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      Test 1
                    </Badge>
                    <span>Create new booking with unique booking number</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      Test 2
                    </Badge>
                    <span>
                      Update existing booking by using same booking number
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      Test 3
                    </Badge>
                    <span>Test error handling with invalid data</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
