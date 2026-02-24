'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Plus,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  Building2,
  Upload,
} from 'lucide-react';
import type { DashboardMetrics, DashboardPromoter } from './types';
import { PromotersKeyboardShortcuts } from './promoters-keyboard-shortcuts';
import { NotificationBadge } from './notification-badge';

interface PromotersHeaderProps {
  metrics: DashboardMetrics;
  promoters: DashboardPromoter[];
  isFetching: boolean;
  onRefresh: () => void;
  onAddPromoter: () => void;
  locale?: string;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: (enabled: boolean) => void;
}

export function PromotersHeader({
  metrics,
  promoters,
  isFetching,
  onRefresh,
  onAddPromoter,
  locale,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
}: PromotersHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const derivedLocale = useMemo(() => {
    if (locale && typeof locale === 'string') return locale;
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      return segments[0] || 'en';
    }
    return 'en';
  }, [locale]);

  const handleAddPromoter = () => {
    try {
      router.push(`/${derivedLocale}/manage-promoters/new`);
      onAddPromoter();
    } catch (error) {
      console.error('Error navigating to add promoter:', error);
      toast({
        variant: 'destructive',
        title: 'Navigation Error',
        description: 'Could not navigate to add promoter page.',
      });
    }
  };

  const handleImportPromoters = () => {
    try {
      router.push(`/${derivedLocale}/csv-import`);
    } catch (error) {
      console.error('Error navigating to import page:', error);
      toast({
        variant: 'destructive',
        title: 'Navigation Error',
        description: 'Could not navigate to import page.',
      });
    }
  };

  return (
    <Card className='relative overflow-visible border-none bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border-b-4 border-indigo-500/30'>
      {/* Professional background pattern */}
      <div className='absolute inset-0 opacity-10 pointer-events-none'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:40px_40px]' />
      </div>
      {/* Subtle gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-blue-500/5 pointer-events-none' />

      <CardHeader className='relative pb-6 overflow-visible'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between w-full'>
          <div className='space-y-4 flex-1 min-w-0 w-full lg:max-w-[calc(100%-400px)]'>
            <div className='flex items-center gap-4 flex-wrap'>
              <div className='rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 p-4 backdrop-blur-sm flex-shrink-0 border border-white/10 shadow-lg'>
                <Users className='h-7 w-7 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-4xl font-bold tracking-tight lg:text-5xl break-words bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent'>
                  Promoter Intelligence Hub
                </CardTitle>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge
                    variant='outline'
                    className='bg-white/10 text-white/90 border-white/20 text-xs font-medium'
                  >
                    Enterprise Edition
                  </Badge>
                  <span className='text-xs text-white/60 font-medium'>
                    Real-time Workforce Analytics
                  </span>
                </div>
              </div>
            </div>
            <CardDescription className='max-w-3xl text-base text-white/90 leading-relaxed break-words font-medium'>
              Monitor workforce readiness, document compliance, and partner
              coverage in real-time to keep every engagement on track.{' '}
              <span className='font-bold text-white text-lg'>
                {metrics.total}
              </span>{' '}
              active promoters in system.
            </CardDescription>
            <div className='flex flex-wrap items-center gap-3 text-sm text-white/90 pt-3 w-full'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={cn(
                        'text-white border-white/30 cursor-pointer transition-all px-4 py-2',
                        'inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0',
                        'overflow-visible shadow-lg backdrop-blur-sm font-semibold',
                        autoRefreshEnabled
                          ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 hover:from-emerald-500/40 hover:to-green-500/40 border-emerald-400/50'
                          : 'bg-white/15 hover:bg-white/25 border-white/20'
                      )}
                      onClick={() => onToggleAutoRefresh?.(!autoRefreshEnabled)}
                    >
                      <Activity
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-transform',
                          autoRefreshEnabled && 'animate-pulse'
                        )}
                      />
                      <span className='whitespace-nowrap overflow-visible'>
                        {autoRefreshEnabled
                          ? 'Auto-refresh on'
                          : 'Auto-refresh off'}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs bg-slate-900 border-slate-700'>
                    <p className='text-xs text-white'>
                      {autoRefreshEnabled
                        ? 'Data automatically refreshes every 60 seconds. Click to disable.'
                        : 'Auto-refresh is disabled. Click to enable automatic updates every 60 seconds.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-50 border-emerald-400/50 cursor-help px-4 py-2 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-lg backdrop-blur-sm font-semibold'>
                      <CheckCircle className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>
                        {Math.round(metrics.complianceRate || 0)}% compliant
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700'>
                    <p className='text-xs text-white'>
                      {Math.round(metrics.complianceRate || 0)}% of promoters
                      have all documents valid and up to date
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-50 border-amber-400/50 cursor-help px-4 py-2 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-lg backdrop-blur-sm font-semibold'>
                      <AlertTriangle className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>
                        {metrics.critical || 0} critical
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700'>
                    <p className='text-xs text-white'>
                      {metrics.critical || 0} promoters have expired documents
                      requiring immediate attention
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-50 border-blue-400/50 cursor-help px-4 py-2 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-lg backdrop-blur-sm font-semibold'>
                      <Building2 className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>
                        {metrics.companies || 0} companies
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700'>
                    <p className='text-xs text-white'>
                      {metrics.companies || 0} companies have assigned promoters
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-3 flex-shrink-0'>
            <Button
              onClick={handleAddPromoter}
              className='bg-gradient-to-r from-white to-white/95 text-slate-900 hover:from-white hover:to-white shadow-xl hover:shadow-2xl font-bold transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap border border-white/20'
              size='lg'
              aria-label='Add new promoter to the system'
            >
              <Plus className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
              <span>Add Promoter</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleImportPromoters}
                    variant='secondary'
                    className='bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-white hover:from-blue-500/40 hover:to-indigo-500/40 border-blue-400/50 font-semibold shadow-xl transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap backdrop-blur-sm'
                    size='lg'
                    aria-label='Import promoters from CSV/Excel file'
                  >
                    <Upload
                      className='mr-2 h-5 w-5 flex-shrink-0'
                      aria-hidden='true'
                    />
                    <span>Import</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className='bg-slate-900 border-slate-700'>
                  <p className='text-xs text-white'>
                    Import promoters from Excel/CSV file
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    className='bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap shadow-lg transition-all duration-300 hover:scale-105'
                    onClick={onRefresh}
                    disabled={isFetching}
                    aria-label={
                      isFetching
                        ? 'Refreshing promoter data'
                        : 'Refresh promoter data'
                    }
                  >
                    <RefreshCw
                      className={cn(
                        'mr-2 h-4 w-4 flex-shrink-0',
                        isFetching && 'animate-spin'
                      )}
                      aria-hidden='true'
                    />
                    <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className='bg-slate-900 border-slate-700'>
                  <p className='text-xs text-white'>
                    Get the latest data immediately (Cmd+R)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <NotificationBadge promoters={promoters} />
            <div className='hidden sm:block flex-shrink-0'>
              <PromotersKeyboardShortcuts />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
