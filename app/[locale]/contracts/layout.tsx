import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contracts Dashboard | Smart Pro Portal',
  description: 'View, manage, and track all your contracts in real-time. Access contract details, download PDFs, and monitor contract status.',
  keywords: ['contracts', 'dashboard', 'management', 'business', 'legal', 'agreements'],
  openGraph: {
    title: 'Contracts Dashboard | Smart Pro Portal',
    description: 'View, manage, and track all your contracts in real-time.',
    type: 'website',
  },
  robots: {
    index: false, // Don't index contract pages for privacy
    follow: false,
  },
};

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
