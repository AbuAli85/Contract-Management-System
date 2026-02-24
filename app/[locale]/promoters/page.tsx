import type { Metadata } from 'next';
import { PromotersPageClient } from './promoters-client';

export const metadata: Metadata = {
  title: 'Promoters | Workforce Management',
  description:
    'Manage promoters and staff members with advanced analytics, document tracking, and real-time notifications. View workforce status, track document expirations, and manage assignments.',
  keywords: [
    'promoters',
    'workforce management',
    'staff management',
    'document tracking',
    'analytics',
    'HR management',
  ],
  openGraph: {
    title: 'Promoters | Workforce Management',
    description:
      'Manage promoters and staff members with advanced analytics and notifications',
    type: 'website',
  },
};

interface PromotersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PromotersPage({ params }: PromotersPageProps) {
  // Await params in Next.js 15+
  const { locale } = await params;

  // Pass only serializable data to client component
  const isDevelopment = process.env.NODE_ENV === 'development';

  return <PromotersPageClient locale={locale} isDevelopment={isDevelopment} />;
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
