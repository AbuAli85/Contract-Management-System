import type { Metadata } from 'next';
import SharafDGDeploymentForm from '@/components/SharafDGDeploymentForm';

export const metadata: Metadata = {
  title: 'Sharaf DG Deployment Letters | Contract Management System',
  description:
    'Generate professional bilingual deployment letters for promoters assigned to Sharaf DG contracts',
  keywords: [
    'sharaf dg',
    'deployment letter',
    'promoter deployment',
    'contract generation',
    'bilingual contracts',
    'arabic contracts',
  ],
};

export default function SharafDGContractsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <SharafDGDeploymentForm />
    </div>
  );
}

