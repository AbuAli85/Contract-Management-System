import type { Metadata } from 'next';
import { PromotersPageClient } from './promoters-client';

export const metadata: Metadata = {
  title: 'Promoters',
  description:
    'Manage promoters and staff members with advanced analytics and notifications',
};

export default function PromotersPage({
  params,
}: {
  params: { locale: string };
}) {
  // Pass only serializable data to client component
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <PromotersPageClient locale={params.locale} isDevelopment={isDevelopment} />
  );
}
