import type { Metadata } from 'next';
import { PromotersPageClient } from './promoters-client';

export const metadata: Metadata = {
  title: 'Workforce Management | SmartPRO',
  description:
    'Manage your workforce: promoters and staff. Track compliance, document expirations, assignments, and performance. Add, import, export, and run analytics in one place.',
  keywords: [
    'workforce management',
    'promoters',
    'staff management',
    'compliance',
    'document tracking',
    'analytics',
    'HR',
  ],
  openGraph: {
    title: 'Workforce Management | SmartPRO',
    description:
      'Manage workforce, track compliance, and run analytics.',
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
