import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters | Contract Management System',
  description: 'Manage promoters and staff members with advanced analytics and notifications',
};

import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';

export default function PromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  return <EnhancedPromotersView locale={params.locale} />;
}
