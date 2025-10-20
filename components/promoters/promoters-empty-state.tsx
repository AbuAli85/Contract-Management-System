'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, RefreshCw, HelpCircle } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            No Promoters Found
          </CardTitle>
          <CardDescription>
            There are currently no promoters in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <HelpCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Possible reasons:</strong>
              <div className='mt-2 space-y-1 text-sm'>
                <div>• No promoters have been added yet</div>
                <div>• Your account may not have access to view promoters</div>
                <div>• Data filters may be too restrictive</div>
                <div>• Database connection issue</div>
              </div>
            </AlertDescription>
          </Alert>
          <div className='flex gap-2'>
            <Button onClick={onAddPromoter} variant='default'>
              <Plus className='mr-2 h-4 w-4' />
              Add First Promoter
            </Button>
            <Button onClick={onRefresh} variant='outline'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
          <div className='rounded-lg bg-blue-50 p-4 text-sm'>
            <strong className='text-blue-900'>Development Mode:</strong>
            <div className='mt-1 text-blue-700'>
              Check browser console (F12) and server logs for detailed debugging
              information.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
