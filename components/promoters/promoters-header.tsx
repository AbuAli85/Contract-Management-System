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
    <Card className='relative overflow-visible border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl'>
      <div className='absolute inset-0 opacity-10 pointer-events-none'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:40px_40px]' />
      </div>
      <CardHeader className='relative pb-6 overflow-visible'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between w-full'>
          <div className='space-y-3 flex-1 min-w-0 w-full lg:max-w-[calc(100%-400px)]'>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='rounded-lg bg-white/10 p-3 backdrop-blur-sm flex-shrink-0'>
                <Users className='h-6 w-6' />
              </div>
              <CardTitle className='text-4xl font-bold tracking-tight lg:text-5xl break-words'>
                Promoter Intelligence Hub
              </CardTitle>
            </div>
            <CardDescription className='max-w-3xl text-base text-white/80 leading-relaxed break-words'>
              Monitor workforce readiness, document compliance, and partner
              coverage in real-time to keep every engagement on track.{' '}
              <span className='font-semibold text-white/90'>{metrics.total}</span> promoters in system.
            </CardDescription>
            <div className='flex flex-wrap items-center gap-2.5 text-sm text-white/70 pt-2 w-full'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      className={cn(
                        'text-white border-white/20 cursor-pointer transition-all px-3 py-1.5',
                        'inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0',
                        'overflow-visible',
                        autoRefreshEnabled 
                          ? 'bg-green-500/20 hover:bg-green-500/30' 
                          : 'bg-white/10 hover:bg-white/20'
                      )}
                      onClick={() => onToggleAutoRefresh?.(!autoRefreshEnabled)}
                    >
                      <Activity className={cn(
                        'h-3.5 w-3.5 flex-shrink-0 transition-transform',
                        autoRefreshEnabled && 'animate-pulse'
                      )} />
                      <span className='whitespace-nowrap overflow-visible'>
                        {autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p className='text-xs'>
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
                    <Badge className='bg-emerald-500/20 text-emerald-100 border-emerald-400/30 cursor-help px-3 py-1.5 inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 overflow-visible'>
                      <CheckCircle className='h-3.5 w-3.5 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{Math.round(metrics.complianceRate || 0)}% compliant</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>
                      {Math.round(metrics.complianceRate || 0)}% of promoters have all documents valid and up to date
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-amber-500/20 text-amber-100 border-amber-400/30 cursor-help px-3 py-1.5 inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 overflow-visible'>
                      <AlertTriangle className='h-3.5 w-3.5 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{metrics.critical || 0} critical</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>
                      {metrics.critical || 0} promoters have expired documents requiring immediate attention
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-blue-500/20 text-blue-100 border-blue-400/30 cursor-help px-3 py-1.5 inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 overflow-visible'>
                      <Building2 className='h-3.5 w-3.5 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{metrics.companies || 0} companies</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>
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
              className='bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg transition-all hover:shadow-xl focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap'
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
                    className='bg-blue-500/20 text-white hover:bg-blue-500/30 border-blue-400/30 font-semibold shadow-lg transition-all hover:shadow-xl focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap'
                    size='lg'
                    aria-label='Import promoters from CSV/Excel file'
                  >
                    <Upload className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
                    <span>Import</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>
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
                    className='bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-white/10 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap'
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
                <TooltipContent>
                  <p className='text-xs'>
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
