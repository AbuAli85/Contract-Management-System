'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  Download,
  BarChart3,
} from 'lucide-react';
import { useRoleContext } from './promoters-role-context';
import type { DashboardPromoter, DashboardMetrics } from './types';
import { PromotersMetricsCards } from './promoters-metrics-cards';
import { PromotersEnhancedCharts } from './promoters-enhanced-charts';

interface PromotersEmployerDashboardProps {
  promoters: DashboardPromoter[];
  metrics: DashboardMetrics;
  onAddPromoter?: () => void;
  onExport?: () => void;
  onViewAnalytics?: () => void;
}

export function PromotersEmployerDashboard({
  promoters,
  metrics,
  onAddPromoter,
  onExport,
  onViewAnalytics,
}: PromotersEmployerDashboardProps) {
  const roleContext = useRoleContext();

  // Calculate employer-specific metrics
  const employerMetrics = useMemo(() => {
    const assignedPromoters = promoters.filter(p => p.employer_id === roleContext.employerId);
    const activeCount = assignedPromoters.filter(p => p.overallStatus === 'active').length;
    const criticalCount = assignedPromoters.filter(p => p.overallStatus === 'critical').length;
    const expiringCount = assignedPromoters.filter(
      p => p.idDocument.status === 'expiring' || p.passportDocument.status === 'expiring'
    ).length;
    const expiredCount = assignedPromoters.filter(
      p => p.idDocument.status === 'expired' || p.passportDocument.status === 'expired'
    ).length;

    const validDocuments = assignedPromoters.filter(
      p => p.idDocument.status === 'valid' && p.passportDocument.status === 'valid'
    ).length;
    const complianceRate = assignedPromoters.length > 0
      ? Math.round((validDocuments / assignedPromoters.length) * 100)
      : 100;

    return {
      total: assignedPromoters.length,
      active: activeCount,
      critical: criticalCount,
      expiring: expiringCount,
      expired: expiredCount,
      unassigned: 0, // Employers don't have unassigned
      companies: 1, // Their own company
      recentlyAdded: 0,
      complianceRate,
    };
  }, [promoters, roleContext.employerId]);

  return (
    <div className='space-y-6'>
      {/* Employer Header */}
      <Card className='shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white via-slate-50/50 to-white'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div className='flex items-center gap-4'>
              <div className='p-3 rounded-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-indigo-500/30 border-2 border-primary/40 shadow-xl'>
                <Building2 className='h-8 w-8 text-white' />
              </div>
              <div>
                <CardTitle className='text-2xl font-bold text-slate-900'>
                  My Workforce Dashboard
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-1'>
                  Manage and monitor your assigned promoters
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              {onAddPromoter && roleContext.canCreate && (
                <Button onClick={onAddPromoter} className='gap-2'>
                  <Plus className='h-4 w-4' />
                  Add Promoter
                </Button>
              )}
              {onExport && roleContext.canExport && (
                <Button variant='outline' onClick={onExport} className='gap-2'>
                  <Download className='h-4 w-4' />
                  Export
                </Button>
              )}
              {onViewAnalytics && roleContext.canViewAnalytics && (
                <Button variant='outline' onClick={onViewAnalytics} className='gap-2'>
                  <BarChart3 className='h-4 w-4' />
                  Analytics
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
              <div className='text-3xl font-bold text-blue-700'>{employerMetrics.total}</div>
              <div className='text-sm text-blue-600 mt-1'>Total Promoters</div>
            </div>
            <div className='text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200'>
              <div className='text-3xl font-bold text-green-700'>{employerMetrics.active}</div>
              <div className='text-sm text-green-600 mt-1'>Active</div>
            </div>
            <div className='text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200'>
              <div className='text-3xl font-bold text-amber-700'>{employerMetrics.expiring}</div>
              <div className='text-sm text-amber-600 mt-1'>Expiring Docs</div>
            </div>
            <div className='text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200'>
              <div className='text-3xl font-bold text-red-700'>{employerMetrics.critical}</div>
              <div className='text-sm text-red-600 mt-1'>Critical</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <PromotersMetricsCards
        metrics={employerMetrics}
        onCardClick={(filterType) => {
          // Handle filter clicks
        }}
        activeFilter={null}
      />

      {/* Enhanced Charts */}
      <PromotersEnhancedCharts
        promoters={promoters.filter(p => p.employer_id === roleContext.employerId)}
        metrics={employerMetrics}
      />

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='border-2 border-green-200 bg-green-50/50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Compliance Rate</p>
                <p className='text-2xl font-bold text-green-700'>{employerMetrics.complianceRate}%</p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-2 border-blue-200 bg-blue-50/50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Documents Expiring</p>
                <p className='text-2xl font-bold text-blue-700'>{employerMetrics.expiring}</p>
              </div>
              <AlertTriangle className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-2 border-red-200 bg-red-50/50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Expired Documents</p>
                <p className='text-2xl font-bold text-red-700'>{employerMetrics.expired}</p>
              </div>
              <FileText className='h-8 w-8 text-red-600' />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

