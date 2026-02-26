'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/components/providers/company-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Activity,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface KpiSnapshot {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  company_id: string;
  computed_at: string;
  metadata: Record<string, unknown> | null;
}

const METRIC_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    format: (v: number, unit?: string | null) => string;
    description: string;
  }
> = {
  total_contracts: {
    label: 'Total Contracts',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    format: (v) => v.toLocaleString(),
    description: 'All contracts in the system',
  },
  active_contracts: {
    label: 'Active Contracts',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    format: (v) => v.toLocaleString(),
    description: 'Currently active contracts',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    format: (v) => v.toLocaleString(),
    description: 'Contracts expiring within 30 days',
  },
  expired_contracts: {
    label: 'Expired Contracts',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    format: (v) => v.toLocaleString(),
    description: 'Contracts that have expired',
  },
  total_promoters: {
    label: 'Total Promoters',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    format: (v) => v.toLocaleString(),
    description: 'All registered promoters',
  },
  active_promoters: {
    label: 'Active Promoters',
    icon: Activity,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    format: (v) => v.toLocaleString(),
    description: 'Promoters with active contracts',
  },
  contract_value_total: {
    label: 'Total Contract Value',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    format: (v, unit) => {
      const currency = unit ?? 'AED';
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v);
    },
    description: 'Sum of all active contract values',
  },
  pending_approvals: {
    label: 'Pending Approvals',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    format: (v) => v.toLocaleString(),
    description: 'Contracts awaiting approval',
  },
};

async function fetchKpiSnapshots(companyId: string): Promise<KpiSnapshot[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('kpi_snapshots')
    .select('*')
    .eq('company_id', companyId)
    .order('computed_at', { ascending: false });

  if (error || !data) return [];

  // Deduplicate: keep only the latest snapshot per metric
  const seen = new Set<string>();
  return data.filter((row) => {
    if (seen.has(row.metric_name)) return false;
    seen.add(row.metric_name);
    return true;
  });
}

async function refreshKpiSnapshots(companyId: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc('refresh_kpi_snapshots', { p_company_id: companyId });
}

function KpiCard({ snapshot }: { snapshot: KpiSnapshot }) {
  const config = METRIC_CONFIG[snapshot.metric_name];
  if (!config) return null;

  const { label, icon: Icon, color, bgColor, format: fmt, description } = config;
  const value = fmt(snapshot.metric_value, snapshot.metric_unit);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {snapshot.period_type}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold mt-2">{value}</CardTitle>
        <CardDescription className="font-medium text-foreground/80">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Updated {format(new Date(snapshot.computed_at), 'MMM d, HH:mm')}
        </p>
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-8 w-24 mt-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24 mt-1" />
      </CardContent>
    </Card>
  );
}

export default function KpiDashboardPage() {
  const { companyId } = useCompany();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: snapshots, isLoading, refetch } = useQuery({
    queryKey: ['kpi-snapshots', companyId],
    queryFn: () => fetchKpiSnapshots(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    if (!companyId) return;
    setIsRefreshing(true);
    try {
      await refreshKpiSnapshots(companyId);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const lastUpdated = snapshots?.[0]?.computed_at;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            KPI Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Key performance indicators for your company
            {lastUpdated && (
              <span className="ml-2">
                · Last updated {format(new Date(lastUpdated), 'MMM d, yyyy HH:mm')}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || !companyId}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ) : !snapshots || snapshots.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-lg">No KPI data yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Click Refresh to compute your first KPI snapshot.
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Compute KPIs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {snapshots.map((snapshot) => (
            <KpiCard key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      )}

      {/* Summary row */}
      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                {
                  label: 'Contract Health',
                  value: (() => {
                    const active = snapshots.find(s => s.metric_name === 'active_contracts')?.metric_value ?? 0;
                    const total = snapshots.find(s => s.metric_name === 'total_contracts')?.metric_value ?? 0;
                    if (!total) return 'N/A';
                    const pct = Math.round((active / total) * 100);
                    return `${pct}%`;
                  })(),
                  icon: TrendingUp,
                  color: 'text-green-600',
                },
                {
                  label: 'Expiry Risk',
                  value: (() => {
                    const expiring = snapshots.find(s => s.metric_name === 'expiring_soon')?.metric_value ?? 0;
                    const active = snapshots.find(s => s.metric_name === 'active_contracts')?.metric_value ?? 0;
                    if (!active) return 'N/A';
                    const pct = Math.round((expiring / active) * 100);
                    return `${pct}%`;
                  })(),
                  icon: AlertTriangle,
                  color: 'text-amber-600',
                },
                {
                  label: 'Pending Actions',
                  value: (snapshots.find(s => s.metric_name === 'pending_approvals')?.metric_value ?? 0).toLocaleString(),
                  icon: Clock,
                  color: 'text-orange-600',
                },
                {
                  label: 'Total Promoters',
                  value: (snapshots.find(s => s.metric_name === 'total_promoters')?.metric_value ?? 0).toLocaleString(),
                  icon: Users,
                  color: 'text-purple-600',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className={cn('h-5 w-5 flex-shrink-0', color)} />
                  <div>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
