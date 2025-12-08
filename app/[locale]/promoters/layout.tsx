import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promoters Management | Smart Pro Portal',
  description:
    'Manage and track all your promoters. View promoter details, document status, and performance metrics.',
  keywords: [
    'promoters',
    'management',
    'employees',
    'staff',
    'human resources',
    'tracking',
  ],
  openGraph: {
    title: 'Promoters Management | Smart Pro Portal',
    description:
      'Manage and track all your promoters with comprehensive tools and insights.',
    type: 'website',
  },
  robots: {
    index: false, // Don't index promoter pages for privacy
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
