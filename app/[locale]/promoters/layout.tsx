import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workforce Management | Smart Pro Portal',
  description:
    'Workforce management: promoters, compliance, documents, and analytics.',
  keywords: [
    'workforce',
    'promoters',
    'management',
    'compliance',
    'documents',
    'analytics',
  ],
  openGraph: {
    title: 'Workforce Management | Smart Pro Portal',
    description:
      'Manage workforce, compliance, and analytics in one place.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PromotersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
