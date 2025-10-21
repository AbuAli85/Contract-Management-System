import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters | Contract Management System',
  description:
    'Manage promoters and staff members with advanced analytics and notifications',
};

import { PromotersStaticView } from '@/components/promoters/promoters-static-view';
import { PromotersDebugInfo } from '@/components/promoters-debug-info';
import { ErrorBoundary } from '@/components/error-boundary';

export default function PromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  // ✅ SECURITY FIX: Only show debug component in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary componentName='Promoters Page'>
      <div className='space-y-6'>
        {isDevelopment && <PromotersDebugInfo />}
        <PromotersStaticView locale={params.locale} />
      </div>
    </ErrorBoundary>
  );
}
