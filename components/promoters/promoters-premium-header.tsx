'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Download,
  BarChart3,
  Settings,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import type { DashboardMetrics, DashboardPromoter } from './types';
import { PromotersKeyboardShortcuts } from './promoters-keyboard-shortcuts';
import { NotificationBadge } from './notification-badge';

interface PromotersPremiumHeaderProps {
  metrics: DashboardMetrics;
  promoters: DashboardPromoter[];
  isFetching: boolean;
  onRefresh: () => void;
  onAddPromoter: () => void;
  locale?: string;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: (enabled: boolean) => void;
}

export function PromotersPremiumHeader({
  metrics,
  promoters,
  isFetching,
  onRefresh,
  onAddPromoter,
  locale,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
}: PromotersPremiumHeaderProps) {
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

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Preparing your data export...',
    });
  };

  const complianceTrend = useMemo(() => {
    const rate = metrics.complianceRate || 0;
    if (rate >= 90) return { trend: 'excellent', color: 'emerald' };
    if (rate >= 75) return { trend: 'good', color: 'blue' };
    if (rate >= 60) return { trend: 'needs-improvement', color: 'amber' };
    return { trend: 'critical', color: 'red' };
  }, [metrics.complianceRate]);

  return (
    <Card className='relative overflow-visible border-none bg-gradient-to-br from-slate-900 via-indigo-950 via-blue-950 to-slate-900 text-white shadow-2xl border-b-4 border-indigo-500/40'>
      {/* Premium Background Effects */}
      <div className='absolute inset-0 opacity-10 pointer-events-none'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:40px_40px]' />
      </div>
      <div className='absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none' />
      <div className='absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05))] bg-[length:20px_20px] opacity-20 pointer-events-none' />
      
      {/* Animated gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none' />
      
      <CardHeader className='relative pb-6 overflow-visible'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between w-full'>
          <div className='space-y-4 flex-1 min-w-0 w-full lg:max-w-[calc(100%-450px)]'>
            {/* Premium Title Section */}
            <div className='flex items-center gap-4 flex-wrap'>
              <div className='relative'>
                <div className='rounded-2xl bg-gradient-to-br from-indigo-500/30 via-blue-500/30 to-purple-500/30 p-4 backdrop-blur-sm flex-shrink-0 border-2 border-white/20 shadow-2xl'>
                  <Users className='h-8 w-8 text-white' />
                </div>
                <div className='absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-slate-900 animate-pulse shadow-lg' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 sm:gap-3 flex-wrap'>
                  <CardTitle className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight break-words bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent drop-shadow-2xl'>
                    Promoter Intelligence Hub
                  </CardTitle>
                  <Badge variant='outline' className='bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-100 border-emerald-400/40 text-xs font-bold px-3 py-1 shadow-lg'>
                    <Sparkles className='h-3 w-3 mr-1' />
                    Premium
                  </Badge>
                </div>
                <div className='flex items-center gap-3 mt-2 flex-wrap'>
                  <Badge variant='outline' className='bg-white/10 text-white/90 border-white/30 text-xs font-semibold'>
                    Enterprise Edition
                  </Badge>
                  <span className='text-xs text-white/70 font-medium flex items-center gap-1'>
                    <Activity className='h-3 w-3' />
                    Real-time Analytics
                  </span>
                  <span className='text-xs text-white/70 font-medium flex items-center gap-1'>
                    <Shield className='h-3 w-3' />
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Description */}
            <CardDescription className='max-w-3xl text-lg text-white/90 leading-relaxed break-words font-medium'>
              Monitor workforce readiness, document compliance, and partner
              coverage in real-time to keep every engagement on track.{' '}
              <span className='font-bold text-white text-xl'>{metrics.total}</span> active promoters in system.
            </CardDescription>

            {/* Premium Metrics Badges */}
            <div className='flex flex-wrap items-center gap-3 text-sm text-white/90 pt-3 w-full'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      className={cn(
                        'text-white border-white/30 cursor-pointer transition-all px-4 py-2.5',
                        'inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0',
                        'overflow-visible shadow-xl backdrop-blur-sm font-bold text-sm',
                        'hover:scale-105 hover:shadow-2xl',
                        autoRefreshEnabled 
                          ? 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 hover:from-emerald-500/50 hover:to-green-500/50 border-emerald-400/60' 
                          : 'bg-white/20 hover:bg-white/30 border-white/30'
                      )}
                      onClick={() => onToggleAutoRefresh?.(!autoRefreshEnabled)}
                    >
                      <Activity className={cn(
                        'h-4 w-4 flex-shrink-0 transition-transform',
                        autoRefreshEnabled && 'animate-pulse'
                      )} />
                      <span className='whitespace-nowrap overflow-visible'>
                        {autoRefreshEnabled ? 'Auto-refresh Active' : 'Auto-refresh Off'}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs bg-slate-900 border-slate-700 shadow-2xl'>
                    <p className='text-xs text-white font-medium'>
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
                    <Badge className={cn(
                      'px-4 py-2.5 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-xl backdrop-blur-sm font-bold text-sm',
                      'hover:scale-105 hover:shadow-2xl transition-all cursor-help',
                      complianceTrend.color === 'emerald' && 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-emerald-50 border-emerald-400/60',
                      complianceTrend.color === 'blue' && 'bg-gradient-to-r from-blue-500/40 to-indigo-500/40 text-blue-50 border-blue-400/60',
                      complianceTrend.color === 'amber' && 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 text-amber-50 border-amber-400/60',
                      complianceTrend.color === 'red' && 'bg-gradient-to-r from-red-500/40 to-rose-500/40 text-red-50 border-red-400/60'
                    )}>
                      <CheckCircle className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{Math.round(metrics.complianceRate || 0)}% Compliant</span>
                      <TrendingUp className='h-3 w-3 flex-shrink-0 opacity-75' />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                    <p className='text-xs text-white font-medium'>
                      {Math.round(metrics.complianceRate || 0)}% of promoters have all documents valid and up to date
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-gradient-to-r from-amber-500/40 to-orange-500/40 text-amber-50 border-amber-400/60 cursor-help px-4 py-2.5 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-xl backdrop-blur-sm font-bold text-sm hover:scale-105 hover:shadow-2xl transition-all'>
                      <AlertTriangle className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{metrics.critical || 0} Critical</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                    <p className='text-xs text-white font-medium'>
                      {metrics.critical || 0} promoters have expired documents requiring immediate attention
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className='bg-gradient-to-r from-blue-500/40 to-indigo-500/40 text-blue-50 border-blue-400/60 cursor-help px-4 py-2.5 inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 overflow-visible shadow-xl backdrop-blur-sm font-bold text-sm hover:scale-105 hover:shadow-2xl transition-all'>
                      <Building2 className='h-4 w-4 flex-shrink-0' />
                      <span className='whitespace-nowrap overflow-visible'>{metrics.companies || 0} Companies</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                    <p className='text-xs text-white font-medium'>
                      {metrics.companies || 0} companies have assigned promoters
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Premium Action Buttons */}
          <div className='flex flex-wrap items-center gap-3 flex-shrink-0'>
            <Button
              onClick={handleAddPromoter}
              className='bg-gradient-to-r from-white via-white to-white/95 text-slate-900 hover:from-white hover:via-white hover:to-white shadow-2xl hover:shadow-3xl font-black transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap border-2 border-white/30 text-base px-6 py-6'
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
                    className='bg-gradient-to-r from-blue-500/40 to-indigo-500/40 text-white hover:from-blue-500/50 hover:to-indigo-500/50 border-blue-400/60 font-bold shadow-xl transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap backdrop-blur-sm text-base px-6 py-6'
                    size='lg'
                    aria-label='Import promoters from CSV/Excel file'
                  >
                    <Upload className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
                    <span>Import</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                  <p className='text-xs text-white font-medium'>
                    Import promoters from Excel/CSV file
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExport}
                    variant='secondary'
                    className='bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white hover:from-emerald-500/50 hover:to-green-500/50 border-emerald-400/60 font-bold shadow-xl transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap backdrop-blur-sm text-base px-6 py-6'
                    size='lg'
                    aria-label='Export promoter data'
                  >
                    <Download className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
                    <span>Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                  <p className='text-xs text-white font-medium'>
                    Export data to Excel/PDF
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    className='bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/30 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap shadow-xl transition-all duration-300 hover:scale-110 text-base px-6 py-6 font-bold'
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
                        'mr-2 h-5 w-5 flex-shrink-0',
                        isFetching && 'animate-spin'
                      )}
                      aria-hidden='true'
                    />
                    <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className='bg-slate-900 border-slate-700 shadow-2xl'>
                  <p className='text-xs text-white font-medium'>
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

