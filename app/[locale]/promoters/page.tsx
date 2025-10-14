import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters | Contract Management System',
  description: 'Manage promoters and staff members with advanced analytics and notifications',
};

import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';
import { PromotersDebugInfo } from '@/components/promoters-debug-info';

export default function PromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <div className="space-y-6">
      <PromotersDebugInfo />
      <EnhancedPromotersView locale={params.locale} />
    </div>
  );
}
