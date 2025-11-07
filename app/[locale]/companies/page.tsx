import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Companies | Contract Management System',
  description: 'Manage companies and corporate entities',
};

import { CompaniesView } from '@/components/companies-view';

export default function CompaniesPage() {
  return <CompaniesView />;
}
