import type { Metadata } from 'next';
import GeneralContractGenerator from '@/components/GeneralContractGenerator';

export const metadata: Metadata = {
  title: 'Generate General Contract | Contract Management System',
  description:
    'Create professional general contracts with automated processing via Make.com integration',
  keywords: [
    'contract generation',
    'general contracts',
    'make.com',
    'automation',
    'document generation',
  ],
};

export default function GeneralContractPage() {
  return (
    <div className='container mx-auto py-6'>
      <GeneralContractGenerator />
    </div>
  );
}
