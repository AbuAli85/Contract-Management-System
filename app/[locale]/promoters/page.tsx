import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters | Contract Management System',
  description: 'Manage promoters and staff members with advanced analytics and notifications',
};

import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';
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
    <ErrorBoundary 
      componentName="Promoters Page"
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Promoters page error:', error, errorInfo);
          // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        }
      }}
    >
      <div className="space-y-6">
        {isDevelopment && <PromotersDebugInfo />}
        <EnhancedPromotersView locale={params.locale} />
      </div>
    </ErrorBoundary>
  );
}
