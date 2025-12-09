'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegendItem {
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  label: string;
  description: string;
  icon: typeof ShieldCheck;
  badgeClass: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    status: 'valid',
    label: 'Valid',
    description: 'Document is current and compliant',
    icon: ShieldCheck,
    badgeClass:
      'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300',
  },
  {
    status: 'expiring',
    label: 'Expiring Soon',
    description: 'Document expires within threshold period',
    icon: Clock,
    badgeClass:
      'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-300',
  },
  {
    status: 'expired',
    label: 'Expired',
    description: 'Document has passed expiry date',
    icon: AlertTriangle,
    badgeClass:
      'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300',
  },
  {
    status: 'missing',
    label: 'Not Provided',
    description: 'Document has not been uploaded',
    icon: HelpCircle,
    badgeClass:
      'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-300',
  },
];

interface DocumentStatusLegendProps {
  className?: string;
  compact?: boolean;
}

export function DocumentStatusLegend({
  className,
  compact = false,
}: DocumentStatusLegendProps) {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-help',
                className
              )}
            >
              <Info className='h-3.5 w-3.5' />
              <span>Document Status Guide</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side='bottom' className='w-80 p-4'>
            <div className='space-y-2'>
              <p className='font-semibold text-sm mb-3'>
                Document Status Legend
              </p>
              {LEGEND_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.status} className='flex items-center gap-2'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border-2 px-2 py-0.5 text-xs font-bold',
                        item.badgeClass
                      )}
                    >
                      <Icon className='h-3 w-3' />
                      {item.label}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {item.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn('border-slate-200 dark:border-slate-700', className)}>
      <CardContent className='p-4'>
        <div className='flex items-center gap-2 mb-3'>
          <Info className='h-4 w-4 text-indigo-500' />
          <h4 className='text-sm font-semibold text-slate-700 dark:text-slate-200'>
            Document Status Legend
          </h4>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {LEGEND_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <TooltipProvider key={item.status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className='flex items-center gap-2 cursor-help'>
                      <Badge
                        variant='outline'
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold',
                          item.badgeClass
                        )}
                      >
                        <Icon className='h-3.5 w-3.5' />
                        {item.label}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
