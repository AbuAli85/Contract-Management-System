'use client';

import { EnhancedPromotersViewRefactored } from '@/components/promoters/enhanced-promoters-view-refactored';
import { PromotersDebugInfo } from '@/components/promoters-debug-info';
import { ErrorBoundary } from '@/components/error-boundary';

interface PromotersPageClientProps {
  locale: string;
  isDevelopment: boolean;
}

export function PromotersPageClient({ locale, isDevelopment }: PromotersPageClientProps) {
  return (
    <ErrorBoundary componentName='Promoters Page'>
      <div className='space-y-6'>
        {isDevelopment && <PromotersDebugInfo />}
        <EnhancedPromotersViewRefactored locale={locale} />
      </div>
    </ErrorBoundary>
  );
}

