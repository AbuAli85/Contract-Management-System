'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

interface PromotersEmptyStateProps {
  onAddPromoter: () => void;
  onRefresh: () => void;
}

export function PromotersEmptyState({
  onAddPromoter,
  onRefresh,
}: PromotersEmptyStateProps) {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <EmptyState
        icon={Users}
        title='No promoters yet'
        description='Start building your team by adding your first promoter. Track their documents, performance, and assignments all in one place.'
        action={{
          label: 'Add Your First Promoter',
          onClick: onAddPromoter,
        }}
        secondaryAction={{
          label: 'Refresh Data',
          onClick: onRefresh,
        }}
        iconClassName='text-blue-500'
      />
    </div>
  );
}
