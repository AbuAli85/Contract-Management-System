'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, Contact, Globe } from 'lucide-react';
import type {
  DocumentStatus,
  DocumentHealth,
  DashboardPromoter,
} from './types';

interface PromotersAlertsPanelProps {
  atRiskPromoters: DashboardPromoter[];
  onViewPromoter: (promoter: DashboardPromoter) => void;
}

const DOCUMENT_STATUS_BADGES: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  expiring: 'bg-amber-50 text-amber-600 border-amber-100',
  expired: 'bg-red-50 text-red-600 border-red-100',
  missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function PromotersAlertsPanel({
  atRiskPromoters,
  onViewPromoter,
}: PromotersAlertsPanelProps) {
  return (
    <Card className='border-dashed'>
      <CardHeader>
        <CardTitle className='text-base'>Document health alerts</CardTitle>
        <CardDescription>
          Promoters with expiring or missing documents are highlighted here.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {atRiskPromoters.length === 0 ? (
          <div className='flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center'>
            <ShieldCheck className='h-10 w-10 text-emerald-500' />
            <div className='space-y-1'>
              <h3 className='text-sm font-semibold text-emerald-700'>
                All documents are healthy
              </h3>
              <p className='text-sm text-emerald-600'>
                No expiring or missing documents detected.
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            {atRiskPromoters.map(promoter => (
              <div
                key={promoter.id}
                className='group rounded-lg border bg-card/60 p-3 shadow-sm transition hover:border-primary/60'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <div className='text-sm font-medium text-foreground'>
                      {promoter.displayName}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {promoter.job_title || promoter.work_location || '—'}
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onViewPromoter(promoter)}
                  >
                    View
                  </Button>
                </div>
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  {['expired', 'expiring', 'missing'].includes(
                    promoter.idDocument.status
                  ) && (
                    <Badge
                      variant='outline'
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-xs font-medium',
                        DOCUMENT_STATUS_BADGES[promoter.idDocument.status]
                      )}
                    >
                      <Contact className='mr-1 h-3 w-3' />
                      ID: {promoter.idDocument.label}
                    </Badge>
                  )}
                  {['expired', 'expiring', 'missing'].includes(
                    promoter.passportDocument.status
                  ) && (
                    <Badge
                      variant='outline'
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-xs font-medium',
                        DOCUMENT_STATUS_BADGES[promoter.passportDocument.status]
                      )}
                    >
                      <Globe className='mr-1 h-3 w-3' />
                      Passport: {promoter.passportDocument.label}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
