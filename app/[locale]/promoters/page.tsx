import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters | Contract Management System',
  description: 'Manage promoters and staff members',
};

import { PromotersView } from '@/components/promoters-view';

export default function PromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  return <PromotersView locale={params.locale} />;
}
