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
} from 'lucide-react';
import type { DashboardMetrics } from './types';
import { PromotersKeyboardShortcuts } from './promoters-keyboard-shortcuts';


interface PromotersHeaderProps {
  metrics: DashboardMetrics;
  isFetching: boolean;
  onRefresh: () => void;
  onAddPromoter: () => void;
  locale?: string;
}

export function PromotersHeader({
  metrics,
  isFetching,
  onRefresh,
  onAddPromoter,
  locale,
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

  return (
    <Card className='relative overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl'>
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:40px_40px]' />
      </div>
      <CardHeader className='relative pb-6'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-white/10 p-3 backdrop-blur-sm'>
                <Users className='h-6 w-6' />
              </div>
              <CardTitle className='text-4xl font-bold tracking-tight lg:text-5xl'>
                Promoter Intelligence Hub
              </CardTitle>
            </div>
            <CardDescription className='max-w-3xl text-base text-white/80'>
              Monitor workforce readiness, document compliance, and partner coverage in real-time to keep every engagement on track. {metrics.total} promoters in system.
            </CardDescription>
            <div className='flex flex-wrap items-center gap-3 text-sm text-white/70 pt-2'>
              <Badge className='bg-white/10 text-white border-white/20'>
                <Activity className='mr-1.5 h-3 w-3' />
                Live data
              </Badge>
              <Badge className='bg-emerald-500/20 text-emerald-100 border-emerald-400/30'>
                <CheckCircle className='mr-1.5 h-3 w-3' />
                {metrics.complianceRate}% compliant
              </Badge>
              <Badge className='bg-amber-500/20 text-amber-100 border-amber-400/30'>
                <AlertTriangle className='mr-1.5 h-3 w-3' />
                {metrics.critical} critical
              </Badge>
              <Badge className='bg-blue-500/20 text-blue-100 border-blue-400/30'>
                <Building2 className='mr-1.5 h-3 w-3' />
                {metrics.companies} companies
              </Badge>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <Button 
              onClick={handleAddPromoter} 
              className='bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg transition-all hover:shadow-xl focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900'
              size='lg'
              aria-label='Add new promoter to the system'
            >
              <Plus className='mr-2 h-5 w-5' aria-hidden='true' />
              Add Promoter
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    className='bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-white/10 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900'
                    onClick={onRefresh}
                    disabled={isFetching}
                    aria-label={isFetching ? 'Refreshing promoter data' : 'Refresh promoter data'}
                  >
                    <RefreshCw
                      className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')}
                      aria-hidden='true'
                    />
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>Refresh promoter data (Cmd+R)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className='hidden sm:block'>
              <PromotersKeyboardShortcuts />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
