'use client';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Download } from 'lucide-react';

export default function DataExportPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          Data Export
        </h1>
        <p className='text-gray-500 mt-2'>
          Export contracts, promoters, and other data to CSV or Excel.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Data Export
          </CardTitle>
          <CardDescription>
            Export contracts, promoters, and other data to CSV or Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <Download className='h-16 w-16 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
              Coming Soon
            </h3>
            <p className='text-gray-500 max-w-md'>
              This feature is currently under development. Please check back
              later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
