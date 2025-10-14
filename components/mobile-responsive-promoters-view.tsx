'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Promoter } from '@/lib/types';

interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: any;
  passportDocument: any;
  overallStatus: 'active' | 'warning' | 'critical' | 'inactive';
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
}

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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
} from 'lucide-react';

interface MobileResponsivePromotersViewProps {
  promoters: DashboardPromoter[];
  locale: string;
}

type ViewMode = 'cards' | 'list' | 'table';
type SortField = 'name' | 'status' | 'created' | 'documents';

export function MobileResponsivePromotersView({ 
  promoters, 
  locale 
}: MobileResponsivePromotersViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'critical' | 'inactive'>('all');
  const [documentFilter, setDocumentFilter] = useState<'all' | 'expired' | 'expiring' | 'missing'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'cards' : 'table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState<DashboardPromoter | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filter and sort promoters
  const filteredPromoters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    return promoters.filter(promoter => {
      const matchesSearch = !normalizedSearch ||
        promoter.displayName.toLowerCase().includes(normalizedSearch) ||
        promoter.contactEmail?.toLowerCase().includes(normalizedSearch) ||
        promoter.contactPhone?.toLowerCase().includes(normalizedSearch) ||
        promoter.organisationLabel?.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || promoter.overallStatus === statusFilter;
      
      const matchesDocument = documentFilter === 'all' ||
        (documentFilter === 'expired' && (
          promoter.idDocument.status === 'expired' || 
          promoter.passportDocument.status === 'expired'
        )) ||
        (documentFilter === 'expiring' && (
          promoter.idDocument.status === 'expiring' || 
          promoter.passportDocument.status === 'expiring'
        )) ||
        (documentFilter === 'missing' && (
          promoter.idDocument.status === 'missing' || 
          promoter.passportDocument.status === 'missing'
        ));

      const matchesAssignment = assignmentFilter === 'all' || 
        promoter.assignmentStatus === assignmentFilter;

      return matchesSearch && matchesStatus && matchesDocument && matchesAssignment;
    }).sort((a, b) => {
      switch (sortField) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'status':
          const statusOrder: Record<string, number> = { critical: 0, warning: 1, active: 2, inactive: 3 };
          return (statusOrder[a.overallStatus] || 3) - (statusOrder[b.overallStatus] || 3);
        case 'created':
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        case 'documents':
          const aDays = Math.min(
            a.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY,
            a.passportDocument.daysRemaining ?? Number.POSITIVE_INFINITY
          );
          const bDays = Math.min(
            b.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY,
            b.passportDocument.daysRemaining ?? Number.POSITIVE_INFINITY
          );
          return aDays - bDays;
        default:
          return 0;
      }
    });
  }, [promoters, searchTerm, statusFilter, documentFilter, assignmentFilter, sortField]);

  const handlePromoterAction = useCallback((promoter: DashboardPromoter, action: 'view' | 'edit') => {
    if (action === 'view') {
      router.push(`/${locale}/promoters/${promoter.id}`);
    } else {
      router.push(`/${locale}/manage-promoters/${promoter.id}`);
    }
  }, [router, locale]);

  const toggleCardExpansion = useCallback((promoterId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promoterId)) {
        newSet.delete(promoterId);
      } else {
        newSet.add(promoterId);
      }
      return newSet;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDocumentFilter('all');
    setAssignmentFilter('all');
  }, []);

  const hasFiltersApplied = searchTerm || statusFilter !== 'all' || 
    documentFilter !== 'all' || assignmentFilter !== 'all';

  return (
    <div className='space-y-4 p-4'>
      {/* Mobile Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Promoters</h1>
          <p className='text-sm text-muted-foreground'>
            {filteredPromoters.length} of {promoters.length} promoters
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {/* View Mode Toggle */}
          <div className='flex items-center border rounded-md'>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('cards')}
              className='rounded-r-none'
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              className='rounded-none'
            >
              <List className='h-4 w-4' />
            </Button>
            {!isMobile && (
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('table')}
                className='rounded-l-none'
              >
                <Users className='h-4 w-4' />
              </Button>
            )}
          </div>
          
          {/* Filters Toggle */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='h-4 w-4 mr-2' />
                Filters
                {hasFiltersApplied && (
                  <Badge variant='secondary' className='ml-2 h-5 w-5 p-0 text-xs'>
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-80'>
              <SheetHeader>
                <SheetTitle>Filter Promoters</SheetTitle>
                <SheetDescription>
                  Refine your promoter list by various criteria
                </SheetDescription>
              </SheetHeader>
              <div className='mt-6 space-y-6'>
                {/* Search */}
                <div className='space-y-2'>
                  <Label htmlFor='mobile-search'>Search</Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='mobile-search'
                      placeholder='Search promoters...'
                      className='pl-10'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className='space-y-2'>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Statuses</SelectItem>
                      <SelectItem value='active'>Operational</SelectItem>
                      <SelectItem value='warning'>Needs Attention</SelectItem>
                      <SelectItem value='critical'>Critical</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Filter */}
                <div className='space-y-2'>
                  <Label>Document Health</Label>
                  <Select value={documentFilter} onValueChange={(value: any) => setDocumentFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Documents</SelectItem>
                      <SelectItem value='expired'>Expired</SelectItem>
                      <SelectItem value='expiring'>Expiring Soon</SelectItem>
                      <SelectItem value='missing'>Missing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment Filter */}
                <div className='space-y-2'>
                  <Label>Assignment</Label>
                  <Select value={assignmentFilter} onValueChange={(value: any) => setAssignmentFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Assignments</SelectItem>
                      <SelectItem value='assigned'>Assigned</SelectItem>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className='space-y-2'>
                  <Label>Sort By</Label>
                  <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='name'>Name</SelectItem>
                      <SelectItem value='status'>Status</SelectItem>
                      <SelectItem value='created'>Created Date</SelectItem>
                      <SelectItem value='documents'>Document Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Button */}
                <Button 
                  variant='outline' 
                  onClick={resetFilters}
                  disabled={!hasFiltersApplied}
                  className='w-full'
                >
                  <X className='h-4 w-4 mr-2' />
                  Reset Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Results */}
      {filteredPromoters.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Users className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              {hasFiltersApplied ? 'No promoters match your filters' : 'No promoters found'}
            </h3>
            <p className='text-muted-foreground text-center mb-4'>
              {hasFiltersApplied 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first promoter.'
              }
            </p>
            {hasFiltersApplied && (
              <Button onClick={resetFilters} variant='outline'>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className='h-[calc(100vh-200px)]'>
          <div className='space-y-4'>
            {viewMode === 'cards' && (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {filteredPromoters.map(promoter => (
                  <PromoterCard
                    key={promoter.id}
                    promoter={promoter}
                    isExpanded={expandedCards.has(promoter.id)}
                    onToggleExpansion={() => toggleCardExpansion(promoter.id)}
                    onView={() => handlePromoterAction(promoter, 'view')}
                    onEdit={() => handlePromoterAction(promoter, 'edit')}
                    onSelect={() => setSelectedPromoter(promoter)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className='space-y-2'>
                {filteredPromoters.map(promoter => (
                  <PromoterListItem
                    key={promoter.id}
                    promoter={promoter}
                    onView={() => handlePromoterAction(promoter, 'view')}
                    onEdit={() => handlePromoterAction(promoter, 'edit')}
                    onSelect={() => setSelectedPromoter(promoter)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'table' && !isMobile && (
              <PromoterTable
                promoters={filteredPromoters}
                onView={(promoter) => handlePromoterAction(promoter, 'view')}
                onEdit={(promoter) => handlePromoterAction(promoter, 'edit')}
              />
            )}
          </div>
        </ScrollArea>
      )}

      {/* Promoter Details Dialog */}
      <Dialog open={!!selectedPromoter} onOpenChange={() => setSelectedPromoter(null)}>
        <DialogContent className='max-w-md'>
          {selectedPromoter && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPromoter.displayName}</DialogTitle>
                <DialogDescription>
                  Promoter details and contact information
                </DialogDescription>
              </DialogHeader>
              <PromoterDetailsContent promoter={selectedPromoter} />
              <div className='flex gap-2'>
                <Button 
                  variant='outline' 
                  onClick={() => handlePromoterAction(selectedPromoter, 'view')}
                  className='flex-1'
                >
                  <Eye className='h-4 w-4 mr-2' />
                  View Full Profile
                </Button>
                <Button 
                  onClick={() => handlePromoterAction(selectedPromoter, 'edit')}
                  className='flex-1'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Edit
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Promoter Card Component
interface PromoterCardProps {
  promoter: DashboardPromoter;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onView: () => void;
  onEdit: () => void;
  onSelect: () => void;
}

function PromoterCard({ 
  promoter, 
  isExpanded, 
  onToggleExpansion, 
  onView, 
  onEdit, 
  onSelect 
}: PromoterCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const statusLabels = {
    active: 'Operational',
    warning: 'Attention',
    critical: 'Critical',
    inactive: 'Inactive',
  };

  return (
    <Card className='group hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Users className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-base'>{promoter.displayName}</CardTitle>
              <CardDescription className='text-sm'>
                {promoter.job_title || promoter.work_location || '—'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onToggleExpansion}
            className='h-8 w-8 p-0'
          >
            {isExpanded ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        </div>
        
        <div className='flex items-center gap-2'>
          <Badge 
            variant='outline' 
            className={cn('text-xs', statusColors[promoter.overallStatus])}
          >
            {statusLabels[promoter.overallStatus]}
          </Badge>
          <Badge 
            variant='outline'
            className={cn(
              'text-xs',
              promoter.assignmentStatus === 'assigned'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            )}
          >
            {promoter.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned'}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className='pt-0 space-y-4'>
          {/* Contact Information */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Contact Information</h4>
            <div className='space-y-1 text-sm'>
              <div className='flex items-center gap-2'>
                <Mail className='h-3 w-3 text-muted-foreground' />
                <span className='truncate'>{promoter.contactEmail}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='h-3 w-3 text-muted-foreground' />
                <span>{promoter.contactPhone}</span>
              </div>
              {promoter.work_location && (
                <div className='flex items-center gap-2'>
                  <MapPin className='h-3 w-3 text-muted-foreground' />
                  <span className='truncate'>{promoter.work_location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Status */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Document Status</h4>
            <div className='space-y-2'>
              <DocumentStatusRow 
                label='ID' 
                health={promoter.idDocument} 
              />
              <DocumentStatusRow 
                label='Passport' 
                health={promoter.passportDocument} 
              />
            </div>
          </div>

          {/* Assignment */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Assignment</h4>
            <p className='text-sm text-muted-foreground'>
              {promoter.organisationLabel}
            </p>
          </div>

          {/* Actions */}
          <div className='flex gap-2 pt-2 border-t'>
            <Button 
              variant='outline' 
              size='sm' 
              onClick={onView}
              className='flex-1'
            >
              <Eye className='h-4 w-4 mr-2' />
              View
            </Button>
            <Button 
              size='sm' 
              onClick={onEdit}
              className='flex-1'
            >
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </Button>
            <Button 
              variant='ghost' 
              size='sm'
              onClick={onSelect}
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Promoter List Item Component
interface PromoterListItemProps {
  promoter: DashboardPromoter;
  onView: () => void;
  onEdit: () => void;
  onSelect: () => void;
}

function PromoterListItem({ promoter, onView, onEdit, onSelect }: PromoterListItemProps) {
  return (
    <Card className='group hover:shadow-sm transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <Users className='h-5 w-5 text-primary' />
            </div>
            <div className='min-w-0 flex-1'>
              <h3 className='font-medium truncate'>{promoter.displayName}</h3>
              <p className='text-sm text-muted-foreground truncate'>
                {promoter.organisationLabel}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <StatusBadge status={promoter.overallStatus} />
                <DocumentStatusBadges 
                  idDoc={promoter.idDocument} 
                  passportDoc={promoter.passportDocument} 
                />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='sm' onClick={onView}>
              <Eye className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' onClick={onEdit}>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' onClick={onSelect}>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Promoter Table Component
interface PromoterTableProps {
  promoters: DashboardPromoter[];
  onView: (promoter: DashboardPromoter) => void;
  onEdit: (promoter: DashboardPromoter) => void;
}

function PromoterTable({ promoters, onView, onEdit }: PromoterTableProps) {
  return (
    <Card>
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='border-b'>
              <tr className='text-left'>
                <th className='p-4 font-medium'>Promoter</th>
                <th className='p-4 font-medium'>Status</th>
                <th className='p-4 font-medium'>Assignment</th>
                <th className='p-4 font-medium'>Documents</th>
                <th className='p-4 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoters.map(promoter => (
                <tr key={promoter.id} className='border-b hover:bg-muted/50'>
                  <td className='p-4'>
                    <div>
                      <div className='font-medium'>{promoter.displayName}</div>
                      <div className='text-sm text-muted-foreground'>
                        {promoter.job_title || '—'}
                      </div>
                    </div>
                  </td>
                  <td className='p-4'>
                    <StatusBadge status={promoter.overallStatus} />
                  </td>
                  <td className='p-4'>
                    <div className='text-sm'>{promoter.organisationLabel}</div>
                    <Badge 
                      variant='outline'
                      className={cn(
                        'text-xs mt-1',
                        promoter.assignmentStatus === 'assigned'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-50 text-slate-700'
                      )}
                    >
                      {promoter.assignmentStatus}
                    </Badge>
                  </td>
                  <td className='p-4'>
                    <DocumentStatusBadges 
                      idDoc={promoter.idDocument} 
                      passportDoc={promoter.passportDocument} 
                    />
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center gap-1'>
                      <Button variant='ghost' size='sm' onClick={() => onView(promoter)}>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm' onClick={() => onEdit(promoter)}>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
function StatusBadge({ status }: { status: 'active' | 'warning' | 'critical' | 'inactive' }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const labels: Record<string, string> = {
    active: 'Operational',
    warning: 'Attention',
    critical: 'Critical',
    inactive: 'Inactive',
  };

  return (
    <Badge variant='outline' className={cn('text-xs', colors[status])}>
      {labels[status]}
    </Badge>
  );
}

function DocumentStatusBadges({ 
  idDoc, 
  passportDoc 
}: { 
  idDoc: any; 
  passportDoc: any; 
}) {
  const getIcon = (status: string) => {
    switch (status) {
      case 'valid': return ShieldCheck;
      case 'expiring': return Clock;
      case 'expired': return AlertTriangle;
      case 'missing': return HelpCircle;
      default: return HelpCircle;
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'expiring': return 'text-amber-600';
      case 'expired': return 'text-red-600';
      case 'missing': return 'text-slate-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className='flex items-center gap-1'>
      <div className='flex items-center gap-1'>
        {React.createElement(getIcon(idDoc.status), { 
          className: cn('h-3 w-3', getColor(idDoc.status)) 
        })}
        <span className='text-xs text-muted-foreground'>ID</span>
      </div>
      <div className='flex items-center gap-1'>
        {React.createElement(getIcon(passportDoc.status), { 
          className: cn('h-3 w-3', getColor(passportDoc.status)) 
        })}
        <span className='text-xs text-muted-foreground'>PP</span>
      </div>
    </div>
  );
}

function DocumentStatusRow({ 
  label, 
  health 
}: { 
  label: string; 
  health: any; 
}) {
  const getIcon = (status: string) => {
    switch (status) {
      case 'valid': return ShieldCheck;
      case 'expiring': return Clock;
      case 'expired': return AlertTriangle;
      case 'missing': return HelpCircle;
      default: return HelpCircle;
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'expiring': return 'text-amber-600';
      case 'expired': return 'text-red-600';
      case 'missing': return 'text-slate-600';
      default: return 'text-slate-600';
    }
  };

  const Icon = getIcon(health.status);

  return (
    <div className='flex items-center justify-between text-sm'>
      <div className='flex items-center gap-2'>
        <Icon className={cn('h-3 w-3', getColor(health.status))} />
        <span className='font-medium'>{label}:</span>
      </div>
      <span className={cn('text-xs', getColor(health.status))}>
        {health.label}
      </span>
    </div>
  );
}

function PromoterDetailsContent({ promoter }: { promoter: DashboardPromoter }) {
  return (
    <div className='space-y-4'>
      {/* Basic Info */}
      <div className='space-y-2'>
        <h4 className='font-medium'>Basic Information</h4>
        <div className='text-sm space-y-1'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Name:</span>
            <span>{promoter.displayName}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Status:</span>
            <StatusBadge status={promoter.overallStatus} />
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Assignment:</span>
            <span>{promoter.organisationLabel}</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className='space-y-2'>
        <h4 className='font-medium'>Contact Information</h4>
        <div className='text-sm space-y-1'>
          <div className='flex items-center gap-2'>
            <Mail className='h-3 w-3 text-muted-foreground' />
            <span className='truncate'>{promoter.contactEmail}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Phone className='h-3 w-3 text-muted-foreground' />
            <span>{promoter.contactPhone}</span>
          </div>
        </div>
      </div>

      {/* Document Status */}
      <div className='space-y-2'>
        <h4 className='font-medium'>Document Status</h4>
        <div className='space-y-2'>
          <DocumentStatusRow label='ID Document' health={promoter.idDocument} />
          <DocumentStatusRow label='Passport' health={promoter.passportDocument} />
        </div>
      </div>
    </div>
  );
}

// Add React import for JSX
import React from 'react';
