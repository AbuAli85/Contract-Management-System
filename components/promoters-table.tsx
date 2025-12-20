'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Search,
  Filter,
  Download,
  Plus,
  Save,
  X,
  Loader2,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Employer {
  id: string;
  name_en?: string | null;
  name_ar?: string | null;
  type?: string | null;
  status?: string | null;
}

interface Promoter {
  id: string;
  first_name: string;
  last_name: string;
  name_en?: string | null;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile_number?: string | null;
  id_card_number: string;
  id_card_expiry_date?: string | null;
  passport_number?: string | null;
  passport_expiry_date?: string | null;
  nationality?: string | null;
  status: string;
  overall_status?: string | null;
  rating?: number | null;
  availability?: string | null;
  job_title?: string | null;
  department?: string | null;
  profile_picture_url?: string | null;
  employer_id?: string | null;
  parties?: Employer | null;
  created_at: string;
  updated_at?: string | null;
}

interface PromotersTableProps {
  promoters: Promoter[];
  onEdit?: (promoterId: string) => void;
  onDelete?: (promoterId: string) => Promise<void>;
  onView?: (promoterId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary' as const,
    icon: XCircle,
    color: 'text-gray-600',
  },
  pending: {
    label: 'Pending',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-yellow-600',
  },
  suspended: {
    label: 'Suspended',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-red-600',
  },
  on_leave: {
    label: 'On Leave',
    variant: 'secondary' as const,
    icon: Calendar,
    color: 'text-blue-600',
  },
};

const OVERALL_STATUS_CONFIG = {
  excellent: { label: 'Excellent', color: 'bg-green-500' },
  good: { label: 'Good', color: 'bg-blue-500' },
  fair: { label: 'Fair', color: 'bg-yellow-500' },
  warning: { label: 'Warning', color: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'bg-red-500' },
};

const AVAILABILITY_CONFIG = {
  available: { label: 'Available', color: 'text-green-600' },
  busy: { label: 'Busy', color: 'text-orange-600' },
  unavailable: { label: 'Unavailable', color: 'text-red-600' },
  part_time: { label: 'Part Time', color: 'text-blue-600' },
};

export function PromotersTable({
  promoters,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  isLoading = false,
}: PromotersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletePromoter, setDeletePromoter] = useState<Promoter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Inline editing state
  const [editingField, setEditingField] = useState<{
    promoterId: string;
    field: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(false);

  // Fetch employers for inline editing
  useEffect(() => {
    const fetchEmployers = async () => {
      setIsLoadingEmployers(true);
      try {
        const response = await fetch('/api/parties?type=Employer&limit=1000');
        const data = await response.json();
        if (data.success && data.parties) {
          setEmployers(data.parties);
        }
      } catch (error) {
        console.error('Error fetching employers:', error);
      } finally {
        setIsLoadingEmployers(false);
      }
    };
    fetchEmployers();
  }, []);

  // Filter promoters based on search and status
  const filteredPromoters = promoters.filter(promoter => {
    const matchesSearch =
      searchQuery === '' ||
      `${promoter.first_name} ${promoter.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      promoter.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promoter.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promoter.id_card_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || promoter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deletePromoter || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deletePromoter.id);
      toast.success('Promoter deleted successfully');
      setDeletePromoter(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting promoter:', error);
      toast.error('Failed to delete promoter');
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline editing handlers
  const startEditing = (promoterId: string, field: string, currentValue: string | null) => {
    setEditingField({ promoterId, field });
    setEditingValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const saveFieldUpdate = async () => {
    if (!editingField) return;

    setIsUpdating(true);
    try {
      const updateData: Record<string, any> = {
        [editingField.field]: editingValue || null,
      };

      const response = await fetch(`/api/promoters/${editingField.promoterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update field');
      }

      toast.success('Field updated successfully');
      setEditingField(null);
      setEditingValue('');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update field. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'ID Card Number',
      'Nationality',
      'Status',
      'Job Title',
      'Department',
    ];

    const rows = filteredPromoters.map(p => [
      p.id,
      p.first_name,
      p.last_name,
      p.email || '',
      p.phone || p.mobile_number || '',
      p.id_card_number,
      p.nationality || '',
      p.status,
      p.job_title || '',
      p.department || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promoters-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Promoters exported successfully');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
      STATUS_CONFIG.active
    );
  };

  const renderStatusBadge = (promoter: Promoter) => {
    const config = getStatusConfig(promoter.status);
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {config.label}
      </Badge>
    );
  };

  const renderOverallStatus = (status?: string | null) => {
    if (!status) return null;

    const config =
      OVERALL_STATUS_CONFIG[status as keyof typeof OVERALL_STATUS_CONFIG];
    if (!config) return null;

    return (
      <div className='flex items-center gap-2'>
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <span className='text-sm text-muted-foreground'>{config.label}</span>
      </div>
    );
  };

  const renderAvailability = (availability?: string | null) => {
    if (!availability) return null;

    const config =
      AVAILABILITY_CONFIG[availability as keyof typeof AVAILABILITY_CONFIG];
    if (!config) return null;

    return (
      <span className={`text-sm ${config.color} font-medium`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className='space-y-4'>
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Promoters</CardTitle>
              <CardDescription>
                Manage and view all promoters in the system
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/manage-promoters/new')}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Promoter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            {/* Search */}
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search promoters...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>

            {/* Filters */}
            <div className='flex items-center gap-2'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[150px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                  <SelectItem value='on_leave'>On Leave</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='sm'
                onClick={handleExport}
                disabled={filteredPromoters.length === 0}
              >
                <Download className='mr-2 h-4 w-4' />
                Export
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className='mt-4 text-sm text-muted-foreground'>
            Showing {filteredPromoters.length} of {promoters.length} promoters
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[60px]'></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>ID Card</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className='w-[80px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className='text-center py-8'>
                      <div className='flex items-center justify-center gap-2'>
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                        <span className='text-muted-foreground'>
                          Loading promoters...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPromoters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className='text-center py-8'>
                      <div className='flex flex-col items-center gap-2'>
                        <User className='h-8 w-8 text-muted-foreground' />
                        <p className='text-muted-foreground'>
                          {searchQuery || statusFilter !== 'all'
                            ? 'No promoters found matching your filters'
                            : 'No promoters found'}
                        </p>
                        {searchQuery || statusFilter !== 'all' ? (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromoters.map(promoter => (
                    <TableRow key={promoter.id}>
                      {/* Avatar */}
                      <TableCell>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage
                            src={promoter.profile_picture_url || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(
                              promoter.first_name,
                              promoter.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {promoter.first_name} {promoter.last_name}
                          </div>
                          {promoter.name_en && (
                            <div className='text-sm text-muted-foreground'>
                              {promoter.name_en}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Contact - Inline Editable */}
                      <TableCell>
                        <div className='space-y-1'>
                          {editingField?.promoterId === promoter.id &&
                          editingField?.field === 'email' ? (
                            <div className='flex items-center gap-1'>
                              <Input
                                type='email'
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                disabled={isUpdating}
                                className='h-7 text-sm'
                                placeholder='email@example.com'
                              />
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={saveFieldUpdate}
                                disabled={isUpdating}
                                className='h-7 w-7 p-0'
                              >
                                {isUpdating ? (
                                  <Loader2 className='h-3 w-3 animate-spin' />
                                ) : (
                                  <Save className='h-3 w-3' />
                                )}
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={cancelEditing}
                                disabled={isUpdating}
                                className='h-7 w-7 p-0'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className='flex items-center gap-1 text-sm cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() =>
                                startEditing(promoter.id, 'email', promoter.email || null)
                              }
                              title='Click to edit email'
                            >
                              <Mail className='h-3 w-3 text-muted-foreground' />
                              <span className='truncate max-w-[200px]'>
                                {promoter.email || 'Click to add email'}
                              </span>
                            </div>
                          )}
                          {editingField?.promoterId === promoter.id &&
                          editingField?.field === 'mobile_number' ? (
                            <div className='flex items-center gap-1'>
                              <Input
                                type='tel'
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                disabled={isUpdating}
                                className='h-7 text-sm'
                                placeholder='+968 9123 4567'
                              />
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={saveFieldUpdate}
                                disabled={isUpdating}
                                className='h-7 w-7 p-0'
                              >
                                {isUpdating ? (
                                  <Loader2 className='h-3 w-3 animate-spin' />
                                ) : (
                                  <Save className='h-3 w-3' />
                                )}
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={cancelEditing}
                                disabled={isUpdating}
                                className='h-7 w-7 p-0'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className='flex items-center gap-1 text-sm cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() =>
                                startEditing(
                                  promoter.id,
                                  'mobile_number',
                                  promoter.mobile_number || promoter.phone || null
                                )
                              }
                              title='Click to edit phone'
                            >
                              <Phone className='h-3 w-3 text-muted-foreground' />
                              <span>
                                {promoter.mobile_number || promoter.phone || 'Click to add phone'}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* ID Card */}
                      <TableCell>
                        <div className='text-sm'>
                          <div className='font-mono'>
                            {promoter.id_card_number}
                          </div>
                          {promoter.nationality && (
                            <div className='text-muted-foreground'>
                              {promoter.nationality}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Employer - Inline Editable */}
                      <TableCell>
                        {editingField?.promoterId === promoter.id &&
                        editingField?.field === 'employer_id' ? (
                          <div className='flex items-center gap-2'>
                            <Select
                              value={editingValue}
                              onValueChange={setEditingValue}
                              disabled={isUpdating || isLoadingEmployers}
                            >
                              <SelectTrigger className='w-[200px] h-8'>
                                <SelectValue placeholder='Select employer' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value=''>Clear Assignment</SelectItem>
                                {employers.map(employer => (
                                  <SelectItem key={employer.id} value={employer.id}>
                                    {employer.name_en || employer.name_ar || employer.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={saveFieldUpdate}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              {isUpdating ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Save className='h-4 w-4' />
                              )}
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className='flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() =>
                              startEditing(
                                promoter.id,
                                'employer_id',
                                promoter.employer_id || null
                              )
                            }
                            title='Click to edit employer assignment'
                          >
                            {promoter.parties ? (
                              <>
                                <Building2 className='h-4 w-4 text-muted-foreground' />
                                <span className='font-medium'>
                                  {promoter.parties.name_en || promoter.parties.name_ar || 'Unknown'}
                                </span>
                              </>
                            ) : (
                              <span className='text-muted-foreground italic'>
                                Click to assign
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Job Title */}
                      <TableCell>
                        <div className='text-sm'>
                          {promoter.job_title || '-'}
                          {promoter.department && (
                            <div className='text-muted-foreground'>
                              {promoter.department}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status - Inline Editable */}
                      <TableCell>
                        {editingField?.promoterId === promoter.id &&
                        editingField?.field === 'status' ? (
                          <div className='flex items-center gap-2'>
                            <Select
                              value={editingValue}
                              onValueChange={setEditingValue}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className='w-[140px] h-8'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='active'>Active</SelectItem>
                                <SelectItem value='inactive'>Inactive</SelectItem>
                                <SelectItem value='pending'>Pending</SelectItem>
                                <SelectItem value='suspended'>Suspended</SelectItem>
                                <SelectItem value='on_leave'>On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={saveFieldUpdate}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              {isUpdating ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Save className='h-4 w-4' />
                              )}
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className='cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() =>
                              startEditing(promoter.id, 'status', promoter.status)
                            }
                            title='Click to edit status'
                          >
                            {renderStatusBadge(promoter)}
                          </div>
                        )}
                      </TableCell>

                      {/* Overall Status - Inline Editable */}
                      <TableCell>
                        {editingField?.promoterId === promoter.id &&
                        editingField?.field === 'overall_status' ? (
                          <div className='flex items-center gap-2'>
                            <Select
                              value={editingValue}
                              onValueChange={setEditingValue}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className='w-[140px] h-8'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='excellent'>Excellent</SelectItem>
                                <SelectItem value='good'>Good</SelectItem>
                                <SelectItem value='fair'>Fair</SelectItem>
                                <SelectItem value='warning'>Warning</SelectItem>
                                <SelectItem value='critical'>Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={saveFieldUpdate}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              {isUpdating ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Save className='h-4 w-4' />
                              )}
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className='cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() =>
                              startEditing(
                                promoter.id,
                                'overall_status',
                                promoter.overall_status || null
                              )
                            }
                            title='Click to edit overall status'
                          >
                            {renderOverallStatus(promoter.overall_status)}
                          </div>
                        )}
                      </TableCell>

                      {/* Availability - Inline Editable */}
                      <TableCell>
                        {editingField?.promoterId === promoter.id &&
                        editingField?.field === 'availability' ? (
                          <div className='flex items-center gap-2'>
                            <Select
                              value={editingValue}
                              onValueChange={setEditingValue}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className='w-[140px] h-8'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='available'>Available</SelectItem>
                                <SelectItem value='busy'>Busy</SelectItem>
                                <SelectItem value='unavailable'>Unavailable</SelectItem>
                                <SelectItem value='part_time'>Part Time</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={saveFieldUpdate}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              {isUpdating ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Save className='h-4 w-4' />
                              )}
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className='cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() =>
                              startEditing(
                                promoter.id,
                                'availability',
                                promoter.availability || null
                              )
                            }
                            title='Click to edit availability'
                          >
                            {renderAvailability(promoter.availability)}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onView && (
                              <DropdownMenuItem
                                onClick={() => onView(promoter.id)}
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => onEdit(promoter.id)}
                              >
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletePromoter(promoter)}
                                  className='text-destructive'
                                >
                                  <Trash2 className='mr-2 h-4 w-4' />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletePromoter}
        onOpenChange={() => setDeletePromoter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>
                {deletePromoter?.first_name} {deletePromoter?.last_name}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
