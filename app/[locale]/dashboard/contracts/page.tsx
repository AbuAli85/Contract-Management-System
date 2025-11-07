'use client';

import ContractReportsTable from '@/components/dashboard/contract-reports-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePlus2Icon } from 'lucide-react';

export default function ContractsPage() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>
          Manage Contracts / إدارة العقود
        </h1>
        <div className='flex gap-2'>
          <Button asChild>
            <Link href={`/${locale}/simple-contract`} prefetch={false}>
              <FilePlus2Icon className='mr-2 h-5 w-5' />
              Quick Contract Generator
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href={`/${locale}/generate-contract`} prefetch={false}>
              <FilePlus2Icon className='mr-2 h-5 w-5' />
              Advanced Generator
            </Link>
          </Button>
        </div>
      </div>
      <ContractReportsTable />
      {/* Additional contract management features can be added here */}
    </div>
  );
}
