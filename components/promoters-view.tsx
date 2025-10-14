'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import { useToast } from '@/hooks/use-toast';
import type { Promoter } from '@/lib/types';

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
import { Label } from '@/components/ui/label';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  UserCheck,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  ShieldCheck,
  Contact,
  Globe,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileText,
} from 'lucide-react';

type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';
type OverallStatus = 'active' | 'warning' | 'critical' | 'inactive';

interface DocumentHealth {
  status: DocumentStatus;
  daysRemaining: number | null;
  expiresOn?: string | null;
  label: string;
}

interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: DocumentHealth;
  passportDocument: DocumentHealth;
  overallStatus: OverallStatus;
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
}

interface DashboardMetrics {
  total: number;
  active: number;
  critical: number;
  expiring: number;
  unassigned: number;
  companies: number;
}

interface PromotersViewProps {
  locale?: string;
}

const STAT_CARD_STYLES = {
  primary: {
    container: 'bg-primary/5 border-primary/10',
    icon: 'bg-primary/15 text-primary',
  },
  neutral: {
    container: 'border-muted-foreground/10',
    icon: 'bg-muted text-muted-foreground',
  },
  warning: {
    container: 'bg-amber-50 border-amber-100',
    icon: 'bg-amber-100 text-amber-600',
  },
  danger: {
    container: 'bg-red-50 border-red-100',
    icon: 'bg-red-100 text-red-600',
  },
} as const;

const DOCUMENT_STATUS_BADGES: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  expiring: 'bg-amber-50 text-amber-600 border-amber-100',
  expired: 'bg-red-50 text-red-600 border-red-100',
  missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

const OVERALL_STATUS_BADGES: Record<OverallStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

const DOCUMENT_STATUS_ICONS: Record<DocumentStatus, LucideIcon> = {
  valid: ShieldCheck,
  expiring: Clock,
  expired: AlertTriangle,
  missing: HelpCircle,
};

const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  active: 'Operational',
  warning: 'Attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

function parseDateSafe(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value?: string | null): string {
  const parsed = parseDateSafe(value);
  if (!parsed) return '—';
  return format(parsed, 'dd MMM yyyy');
}

function computeDocumentHealth(
  value: string | null | undefined,
  threshold: number
): DocumentHealth {
  const parsed = parseDateSafe(value);
  if (!parsed) {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: null,
      label: 'No document',
    };
  }

  const days = differenceInDays(parsed, new Date());

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(days),
      expiresOn: value ?? null,
      label: `Expired ${Math.abs(days)} days ago`,
    };
  }

  if (days <= threshold) {
    return {
      status: 'expiring',
      daysRemaining: days,
      expiresOn: value ?? null,
      label: `Expires in ${days} days`,
    };
  }

  return {
    status: 'valid',
    daysRemaining: days,
    expiresOn: value ?? null,
    label: `Valid until ${formatDisplayDate(value)}`,
  };
}

function computeOverallStatus(
  status: string | null | undefined,
  idDoc: DocumentHealth,
  passportDoc: DocumentHealth
): OverallStatus {
  if (
    !status ||
    ['inactive', 'terminated', 'resigned', 'on_leave', 'suspended'].includes(
      status
    )
  ) {
    return 'inactive';
  }

  if (idDoc.status === 'expired' || passportDoc.status === 'expired') {
    return 'critical';
  }

  if (
    idDoc.status === 'expiring' ||
    passportDoc.status === 'expiring' ||
    idDoc.status === 'missing' ||
    passportDoc.status === 'missing'
  ) {
    return 'warning';
  }

  return 'active';
}

async function fetchPromoters(): Promise<Promoter[]> {
  const response = await fetch('/api/promoters', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Unable to load promoters from the server.');
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.error || 'Failed to load promoters.');
  }


  return (payload.promoters || []) as Promoter[];
}

export function PromotersView({ locale }: PromotersViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OverallStatus | 'all'>('all');
  const [documentFilter, setDocumentFilter] = useState<
    'all' | 'expired' | 'expiring' | 'missing'
  >('all');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all');

  const derivedLocale = useMemo(() => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      return segments[0] || 'en';
    }
    return 'en';
  }, [locale]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<Promoter[], Error>({
    queryKey: ['promoters'],
    queryFn: fetchPromoters,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Unable to load promoters',
        description: error.message,
      });
    }
  }, [isError, error, toast]);

  const promoters = data ?? [];
  const dashboardPromoters = useMemo<DashboardPromoter[]>(() => {
    return promoters.map(promoter => {
      const idDocument = computeDocumentHealth(
        promoter.id_card_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY
      );
      const passportDocument = computeDocumentHealth(
        promoter.passport_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY
      );

      const fallbackName =
        (promoter as any)?.first_name || (promoter as any)?.last_name
          ? `${(promoter as any)?.first_name || ''} ${(promoter as any)?.last_name || ''}`.trim()
          : promoter.email || 'Unnamed promoter';

      const displayName =
        promoter.name_en?.trim() ||
        promoter.name_ar?.trim() ||
        fallbackName ||
        'Unnamed Promoter';

      const assignmentStatus = promoter.employer_id ? 'assigned' : 'unassigned';

      const organisationLabel =
        (promoter.parties as any)?.name_en ||
        (promoter.parties as any)?.name_ar ||
        promoter.work_location ||
        promoter.job_title ||
        'Unassigned';

      const overallStatus = computeOverallStatus(
        promoter.status,
        idDocument,
        passportDocument
      );

      return {
        ...promoter,
        displayName,
        assignmentStatus,
        organisationLabel,
        idDocument,
        passportDocument,
        overallStatus,
        contactEmail: promoter.email ?? '—',
        contactPhone: promoter.mobile_number ?? promoter.phone ?? '—',
        createdLabel: formatDisplayDate(promoter.created_at),
      } as DashboardPromoter;
    });
  }, [promoters]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const total = dashboardPromoters.length;
    const active = dashboardPromoters.filter(
      promoter => promoter.overallStatus === 'active'
    ).length;
    const critical = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'expired' ||
        promoter.passportDocument.status === 'expired'
    ).length;
    const expiring = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'expiring' ||
        promoter.passportDocument.status === 'expiring'
    ).length;
    const unassigned = dashboardPromoters.filter(
      promoter => promoter.assignmentStatus === 'unassigned'
    ).length;
    const companies = new Set(
      dashboardPromoters
        .map(promoter => promoter.employer_id)
        .filter(Boolean) as string[]
    ).size;

    return {
      total,
      active,
      critical,
      expiring,
      unassigned,
      companies,
    };
  }, [dashboardPromoters]);

  const filteredPromoters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dashboardPromoters.filter(promoter => {
      const matchesSearch =
        !normalizedSearch ||
        promoter.displayName.toLowerCase().includes(normalizedSearch) ||
        promoter.contactEmail?.toLowerCase().includes(normalizedSearch) ||
        promoter.contactPhone?.toLowerCase().includes(normalizedSearch) ||
        promoter.organisationLabel?.toLowerCase().includes(normalizedSearch) ||
        promoter.job_title?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' || promoter.overallStatus === statusFilter;

      const matchesDocument =
        documentFilter === 'all' ||
        (documentFilter === 'expired' &&
          (promoter.idDocument.status === 'expired' ||
            promoter.passportDocument.status === 'expired')) ||
        (documentFilter === 'expiring' &&
          (promoter.idDocument.status === 'expiring' ||
            promoter.passportDocument.status === 'expiring')) ||
        (documentFilter === 'missing' &&
          (promoter.idDocument.status === 'missing' ||
            promoter.passportDocument.status === 'missing'));

      const matchesAssignment =
        assignmentFilter === 'all' ||
        promoter.assignmentStatus === assignmentFilter;

      return (
        matchesSearch && matchesStatus && matchesDocument && matchesAssignment
      );
    });
  }, [
    dashboardPromoters,
    searchTerm,
    statusFilter,
    documentFilter,
    assignmentFilter,
  ]);

  const sortedPromoters = useMemo(() => {
    const severityRank = (status: OverallStatus) => {
      switch (status) {
        case 'critical':
          return 0;
        case 'warning':
          return 1;
        case 'active':
          return 2;
        case 'inactive':
        default:
          return 3;
      }
    };

    return [...filteredPromoters].sort((a, b) => {
      const severityDiff =
        severityRank(a.overallStatus) - severityRank(b.overallStatus);

      if (severityDiff !== 0) return severityDiff;

      const daysA = a.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY;
      const daysB = b.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY;

      if (daysA !== daysB) {
        return daysA - daysB;
      }

      return a.displayName.localeCompare(b.displayName);
    });
  }, [filteredPromoters]);

  const atRiskPromoters = useMemo(() => {
    return sortedPromoters
      .filter(
        promoter =>
          promoter.idDocument.status !== 'valid' ||
          promoter.passportDocument.status !== 'valid'
      )
      .slice(0, 5);
  }, [sortedPromoters]);

  const hasFiltersApplied =
    statusFilter !== 'all' ||
    documentFilter !== 'all' ||
    assignmentFilter !== 'all' ||
    searchTerm.trim().length > 0;

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDocumentFilter('all');
    setAssignmentFilter('all');
  }, []);

  const handleAddPromoter = useCallback(() => {
    router.push(`/${derivedLocale}/manage-promoters/new`);
  }, [router, derivedLocale]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExport = useCallback(() => {
    if (!sortedPromoters.length) {
      toast({
        title: 'Nothing to export',
        description: 'Add promoters or adjust your filters.',
      });
      return;
    }

    const headers = [
      'Promoter',
      'Status',
      'Email',
      'Phone',
      'Assignment',
      'ID Document',
      'Passport',
      'Created',
    ];

    const rows = sortedPromoters.map(promoter => [
      promoter.displayName,
      promoter.overallStatus,
      promoter.contactEmail ?? '',
      promoter.contactPhone ?? '',
      promoter.assignmentStatus,
      promoter.idDocument.label,
      promoter.passportDocument.label,
      promoter.createdLabel,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'promoters-dashboard.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export ready',
      description: 'Your promoter dashboard report is downloading.',
    });
  }, [sortedPromoters, toast]);

  const handleViewPromoter = useCallback(
    (promoter: DashboardPromoter) => {
      router.push(`/${derivedLocale}/promoters/${promoter.id}`);
    },
    [router, derivedLocale]
  );

  const handleEditPromoter = useCallback(
    (promoter: DashboardPromoter) => {
      router.push(`/${derivedLocale}/manage-promoters/${promoter.id}`);
    },
    [router, derivedLocale]
  );

  const handleArchivePromoter = useCallback(
    (promoter: DashboardPromoter) => {
      toast({
        title: 'Archive workflow',
        description: `Archiving for ${promoter.displayName} is coming soon.`,
      });
    },
    [toast]
  );

  if (isLoading) {
    return <PromotersSkeleton />;
  }
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Card className='relative overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'>
        <CardHeader className='pb-6'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-2'>
              <CardTitle className='text-3xl font-semibold tracking-tight lg:text-4xl'>
                Promoter Intelligence Hub
              </CardTitle>
              <CardDescription className='max-w-2xl text-base text-white/80'>
                Monitor workforce readiness, document compliance, and partner coverage in real-time to keep every engagement on track.
              </CardDescription>
              <div className='flex flex-wrap items-center gap-3 text-sm text-white/70'>
                <Badge className='bg-white/10 text-white'>Live data</Badge>
                <span>
                  {metrics.active} active • {metrics.critical} critical alerts • {metrics.companies} partner organisations
                </span>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Button 
                onClick={handleAddPromoter} 
                className='bg-white text-slate-900 hover:bg-white/90'
                size='lg'
              >
                <Plus className='mr-2 h-5 w-5' />
                Add Promoter
              </Button>
              <Button
                variant='secondary'
                className='bg-white/10 text-white hover:bg-white/20'
                onClick={handleExport}
                size='lg'
              >
                <Download className='mr-2 h-5 w-5' />
                Export report
              </Button>
              <Button
                variant='secondary'
                className='bg-white/10 text-white hover:bg-white/20'
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin text-white/70')}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Total promoters'
          value={metrics.total}
          helper={`${metrics.active} active right now`}
          icon={Users}
          variant='primary'
        />
        <StatCard
          title='Active workforce'
          value={metrics.active}
          helper={`${metrics.unassigned} awaiting assignment`}
          icon={UserCheck}
          variant='neutral'
        />
        <StatCard
          title='Document alerts'
          value={metrics.critical}
          helper={`${metrics.expiring} expiring soon`}
          icon={ShieldAlert}
          variant={metrics.critical > 0 ? 'danger' : 'warning'}
        />
        <StatCard
          title='Partner coverage'
          value={metrics.companies}
          helper={`${metrics.total - metrics.unassigned} assigned staff`}
          icon={Building2}
          variant='neutral'
        />
      </div>

      <Card>
        <CardHeader className='pb-5'>
          <CardTitle className='text-lg'>Smart filters</CardTitle>
          <CardDescription>
            Refine the promoter roster by lifecycle stage, document health, or assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]'>
            <div className='space-y-2'>
              <Label htmlFor='promoter-search'>Search promoters</Label>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='promoter-search'
                  placeholder='Search by name, contact, or role'
                  className='pl-10'
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Lifecycle</Label>
                <Select
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as OverallStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All statuses</SelectItem>
                    <SelectItem value='active'>Operational</SelectItem>
                    <SelectItem value='warning'>Needs attention</SelectItem>
                    <SelectItem value='critical'>Critical</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Document health</Label>
                <Select
                  value={documentFilter}
                  onValueChange={value =>
                    setDocumentFilter(value as 'all' | 'expired' | 'expiring' | 'missing')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All documents' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All documents</SelectItem>
                    <SelectItem value='expired'>Expired</SelectItem>
                    <SelectItem value='expiring'>Expiring soon</SelectItem>
                    <SelectItem value='missing'>Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Assignment</Label>
                <Select
                  value={assignmentFilter}
                  onValueChange={value =>
                    setAssignmentFilter(value as 'all' | 'assigned' | 'unassigned')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All assignments' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All assignments</SelectItem>
                    <SelectItem value='assigned'>Assigned</SelectItem>
                    <SelectItem value='unassigned'>Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Button variant='outline' onClick={handleResetFilters} disabled={!hasFiltersApplied}>
                Reset filters
              </Button>
              <Button variant='outline' onClick={handleExport} className='flex items-center'>
                <Download className='mr-2 h-4 w-4' />
                Export view
              </Button>
              <Button onClick={handleRefresh} variant='outline' disabled={isFetching}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin text-muted-foreground')} />
                Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <Card className='overflow-hidden'>
          <CardHeader className='flex flex-col gap-2 border-b bg-muted/10 py-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-lg'>Promoter roster</CardTitle>
              <CardDescription>
                {sortedPromoters.length} of {dashboardPromoters.length} records visible
              </CardDescription>
            </div>
            {isFetching && (
              <Badge variant='outline' className='gap-2'>
                <RefreshCw className='h-3 w-3 animate-spin' />
                Refreshing
              </Badge>
            )}
          </CardHeader>
          <CardContent className='p-0'>
            {sortedPromoters.length === 0 ? (
              <div className='flex flex-col items-center justify-center space-y-4 py-16 text-center'>
                <div className='rounded-full bg-muted p-6'>
                  <Users className='h-12 w-12 text-muted-foreground' />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-semibold tracking-tight'>
                    {hasFiltersApplied ? 'No promoters match your filters' : 'No promoters yet'}
                  </h3>
                  <p className='max-w-sm text-sm text-muted-foreground'>
                    {hasFiltersApplied 
                      ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                      : 'Get started by adding your first promoter to the system.'
                    }
                  </p>
                </div>
                <div className='flex gap-3'>
                  {hasFiltersApplied && (
                    <Button onClick={handleResetFilters} variant='outline'>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={handleAddPromoter} size='lg'>
                    <Plus className='mr-2 h-5 w-5' />
                    Add Your First Promoter
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className='h-[520px]'>
                <Table>
                  <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
                    <TableRow>
                      <TableHead className='w-[220px]'>Promoter</TableHead>
                      <TableHead className='w-[200px]'>Documents</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPromoters.map(promoter => (
                      <TableRow
                        key={promoter.id}
                        className={cn(
                          'group transition-colors hover:bg-muted/40',
                          promoter.overallStatus === 'critical' && 'border-l-2 border-l-red-500',
                          promoter.overallStatus === 'warning' && 'border-l-2 border-l-amber-400'
                        )}
                      >
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <SafeImage
                              src={promoter.profile_picture_url ?? null}
                              alt={promoter.displayName}
                              width={40}
                              height={40}
                              className='h-10 w-10 rounded-full border border-white/50 object-cover shadow-sm'
                              fallback={
                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
                                  <Users className='h-5 w-5' />
                                </div>
                              }
                            />
                            <div className='space-y-0.5'>
                              <div className='font-medium leading-none text-foreground'>
                                {promoter.displayName}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {promoter.job_title || promoter.work_location || '—'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <DocumentStatusPill label='ID' health={promoter.idDocument} />
                            <DocumentStatusPill label='Passport' health={promoter.passportDocument} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='text-sm font-medium text-foreground'>
                              {promoter.organisationLabel}
                            </div>
                            <Badge
                              variant='outline'
                              className={cn(
                                'w-fit rounded-full border px-2 py-0.5 text-xs font-medium',
                                promoter.assignmentStatus === 'assigned'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              )}
                            >
                              {promoter.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1 text-sm text-muted-foreground'>
                            <InfoLine icon={Mail} text={promoter.contactEmail} />
                            <InfoLine icon={Phone} text={promoter.contactPhone} />
                            {promoter.work_location && (
                              <InfoLine icon={MapPin} text={promoter.work_location} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          <InfoLine icon={Calendar} text={promoter.createdLabel} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-medium',
                              OVERALL_STATUS_BADGES[promoter.overallStatus]
                            )}
                          >
                            {OVERALL_STATUS_LABELS[promoter.overallStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <ActionsMenu
                            promoter={promoter}
                            onView={handleViewPromoter}
                            onEdit={handleEditPromoter}
                            onArchive={handleArchivePromoter}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

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
                        onClick={() => handleViewPromoter(promoter)}
                      >
                        View
                      </Button>
                    </div>
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      {['expired', 'expiring', 'missing'].includes(promoter.idDocument.status) && (
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
                      {['expired', 'expiring', 'missing'].includes(promoter.passportDocument.status) && (
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
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  variant?: keyof typeof STAT_CARD_STYLES;
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  variant = 'neutral',
}: StatCardProps) {
  const styles = STAT_CARD_STYLES[variant];

  return (
    <Card className={cn('shadow-sm', styles.container)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <div
          className={cn(
            'rounded-full p-2 text-slate-700 transition group-hover:scale-105',
            styles.icon
          )}
        >
          <Icon className='h-4 w-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-semibold tracking-tight'>{value}</div>
        {helper && (
          <p className='mt-1 text-sm text-muted-foreground'>{helper}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface InfoLineProps {
  icon: LucideIcon;
  text?: string | null;
}

function InfoLine({ icon: Icon, text }: InfoLineProps) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='h-3.5 w-3.5 text-muted-foreground/80' />
      <span className='truncate text-xs text-muted-foreground'>
        {text && text !== '—' ? text : '—'}
      </span>
    </div>
  );
}

function DocumentStatusPill({
  label,
  health,
}: {
  label: string;
  health: DocumentHealth;
}) {
  const Icon = DOCUMENT_STATUS_ICONS[health.status];

  return (
    <div className='flex items-center justify-between gap-2'>
      <Badge
        variant='outline'
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
          DOCUMENT_STATUS_BADGES[health.status]
        )}
      >
        <Icon className='h-3 w-3' />
        {label}
      </Badge>
      <span className='text-[11px] text-muted-foreground'>{health.label}</span>
    </div>
  );
}

interface ActionsMenuProps {
  promoter: DashboardPromoter;
  onView: (promoter: DashboardPromoter) => void;
  onEdit: (promoter: DashboardPromoter) => void;
  onArchive: (promoter: DashboardPromoter) => void;
}

function ActionsMenu({ promoter, onView, onEdit, onArchive }: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground hover:text-foreground'
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onView(promoter)}>
          <UserCheck className='mr-2 h-4 w-4' />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(promoter)}>
          <FileText className='mr-2 h-4 w-4' />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onArchive(promoter)}>
          <ShieldAlert className='mr-2 h-4 w-4' />
          Archive record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PromotersSkeleton() {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Skeleton className='h-48 w-full' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-32 w-full' />
        ))}
      </div>
      <Skeleton className='h-32 w-full' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <Skeleton className='h-[520px] w-full' />
        <Skeleton className='h-[520px] w-full' />
      </div>
    </div>
  );
}
