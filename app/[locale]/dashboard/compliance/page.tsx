'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

interface ComplianceAlert {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
}> = {
  critical: { label: 'Critical', icon: AlertCircle, badgeClass: 'bg-red-100 text-red-700 border-red-300' },
  high:     { label: 'High',     icon: AlertTriangle, badgeClass: 'bg-orange-100 text-orange-700 border-orange-300' },
  medium:   { label: 'Medium',   icon: AlertTriangle, badgeClass: 'bg-amber-100 text-amber-700 border-amber-300' },
  low:      { label: 'Low',      icon: Info, badgeClass: 'bg-blue-100 text-blue-700 border-blue-300' },
  info:     { label: 'Info',     icon: Info, badgeClass: 'bg-slate-100 text-slate-600 border-slate-300' },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; badgeClass: string }> = {
  open:         { label: 'Open',         badgeClass: 'bg-red-50 text-red-600 border-red-200' },
  acknowledged: { label: 'Acknowledged', badgeClass: 'bg-amber-50 text-amber-600 border-amber-200' },
  resolved:     { label: 'Resolved',     badgeClass: 'bg-green-50 text-green-600 border-green-200' },
  dismissed:    { label: 'Dismissed',    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200' },
};

async function fetchAlerts(companyId: string): Promise<ComplianceAlert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('compliance_alerts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as ComplianceAlert[];
}

async function updateAlertStatus(alertId: string, status: AlertStatus): Promise<void> {
  const supabase = createClient();
  const update: Partial<ComplianceAlert> = { status };
  if (status === 'resolved') {
    (update as any).resolved_at = new Date().toISOString();
  }
  await supabase.from('compliance_alerts').update(update).eq('id', alertId);
}

async function generateAlerts(companyId: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc('generate_compliance_alerts', { p_company_id: companyId });
}

export default function CompliancePage() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['compliance-alerts', companyId],
    queryFn: () => fetchAlerts(companyId!),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      updateAlertStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts', companyId] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update alert', variant: 'destructive' });
    },
  });

  const handleGenerate = async () => {
    if (!companyId) return;
    setIsGenerating(true);
    try {
      await generateAlerts(companyId);
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts', companyId] });
      toast({ title: 'Alerts refreshed', description: 'Compliance alerts have been regenerated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate alerts', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = (alerts ?? []).filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSearch =
      !search ||
      alert.title.toLowerCase().includes(search.toLowerCase()) ||
      (alert.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const openCount = (alerts ?? []).filter(a => a.status === 'open').length;
  const criticalCount = (alerts ?? []).filter(a => a.severity === 'critical' && a.status === 'open').length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Compliance Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and resolve compliance issues across your contracts and promoters
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !companyId}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
          Regenerate Alerts
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Alerts', value: openCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Critical', value: criticalCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Alerts', value: (alerts ?? []).length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resolved', value: (alerts ?? []).filter(a => a.status === 'resolved').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '—' : value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Alerts
            <Badge variant="secondary" className="ml-2">
              {filtered.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-medium">No alerts found</p>
              <p className="text-sm text-muted-foreground">
                {alerts?.length === 0
                  ? 'Click "Regenerate Alerts" to scan for compliance issues.'
                  : 'No alerts match your current filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((alert) => {
                  const sevConfig = SEVERITY_CONFIG[alert.severity];
                  const statConfig = STATUS_CONFIG[alert.status];
                  const SevIcon = sevConfig.icon;

                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant="outline" className={cn('flex items-center gap-1 w-fit', sevConfig.badgeClass)}>
                          <SevIcon className="h-3 w-3" />
                          {sevConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {alert.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground capitalize">
                          {alert.alert_type.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {alert.due_date ? (
                          <span className={cn(
                            'text-xs',
                            new Date(alert.due_date) < new Date()
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          )}>
                            {format(new Date(alert.due_date), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', statConfig.badgeClass)}>
                          {statConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {alert.status === 'open' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => updateMutation.mutate({ id: alert.id, status: 'acknowledged' })}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          {(alert.status === 'open' || alert.status === 'acknowledged') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-600 hover:text-green-700"
                              onClick={() => updateMutation.mutate({ id: alert.id, status: 'resolved' })}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                          {alert.status === 'open' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => updateMutation.mutate({ id: alert.id, status: 'dismissed' })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
