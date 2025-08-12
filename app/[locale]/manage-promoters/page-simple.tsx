'use client';

import { AuthenticatedLayout } from '@/components/authenticated-layout';

export default function SimpleManagePromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <AuthenticatedLayout locale={params.locale}>
      <div className='p-8'>
        <h1 className='text-2xl font-bold mb-4'>Manage Promoters (Simple)</h1>
        <p className='text-muted-foreground'>
          This is a simple version of the manage promoters page without data
          fetching.
        </p>
        <div className='mt-4 p-4 bg-muted rounded'>
          <h2 className='font-semibold mb-2'>Test Content</h2>
          <p>
            If you can see this content with a sidebar and header, then the
            layout is working correctly.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
