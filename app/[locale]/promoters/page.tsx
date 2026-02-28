import type { Metadata } from 'next';
import { PromotersPageClient } from './promoters-client';

export const metadata: Metadata = {
  title: 'Promoters | Profiles & Details | SmartPRO',
  description:
    'Promoters: view profiles, details, and compliance. Add, import, export, search, and filter. Analytics available when needed.',
  keywords: [
    'promoters',
    'profiles',
    'details',
    'compliance',
    'workforce',
  ],
  openGraph: {
    title: 'Promoters | Profiles & Details | SmartPRO',
    description:
      'View promoter profiles, details, and compliance.',
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
