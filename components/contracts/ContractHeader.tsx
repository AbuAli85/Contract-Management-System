// components/contracts/ContractHeader.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ContractHeaderProps {
  contractId: string;
  onBack?: () => void;
}

export function ContractHeader({ contractId, onBack }: ContractHeaderProps) {
  return (
    <div className='mb-6'>
      <Button
        variant='outline'
        className='mb-4'
        onClick={onBack || (() => window.history.back())}
      >
        ← Back to Contracts
      </Button>

      <h1 className='text-3xl font-bold text-gray-900'>Contract Details</h1>
      <p className='text-gray-600'>Contract ID: {contractId}</p>
    </div>
  );
}
