'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  FileText,
  CheckSquare,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  BarChart3,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Settings,
  Shield,
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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

interface CompanyStats {
  employees: number;
  pending_leaves: number;
  pending_expenses: number;
  active_contracts: number;
  checked_in_today: number;
  open_tasks: number;
  pending_reviews: number;
}

interface CompanyData {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  group_name: string | null;
  user_role: string;
  stats: CompanyStats;
}

interface Summary {
  total_companies: number;
  total_employees: number;
  total_pending_leaves: number;
  total_pending_expenses: number;
  total_contracts: number;
  total_open_tasks: number;
  total_checked_in: number;
}

const roleColors: Record<string, string> = {
  owner:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manager:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

// Permission helper functions - Role-based with support for explicit permissions via API
// Note: To use explicit permissions, integrate useCompanyActions hook from @/hooks/use-company-permissions
const canCreateCompany = (role: string): boolean => {
  return ['owner', 'admin'].includes(role.toLowerCase());
};

const canEditCompany = (userRole: string, companyRole: string): boolean => {
  const role = userRole.toLowerCase();
  if (['owner', 'admin'].includes(role)) return true;
  if (
    role === 'manager' &&
    ['owner', 'admin', 'manager'].includes(companyRole.toLowerCase())
  )
    return true;
  return false;
};

const canDeleteCompany = (userRole: string, companyRole: string): boolean => {
  return (
    userRole.toLowerCase() === 'owner' && companyRole.toLowerCase() === 'owner'
  );
};

export default function CrossCompanyDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [grouped, setGrouped] = useState<Record<string, CompanyData[]>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(
    null
  );
  const [deletingCompany, setDeletingCompany] = useState<CompanyData | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  });
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'employees' | 'attendance'>(
    'name'
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  // Initialize expanded groups
  useEffect(() => {
    if (Object.keys(grouped).length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(Object.keys(grouped)));
    }
  }, [grouped]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company/cross-company-report', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Ensure we have valid data structures
        setCompanies(Array.isArray(data.companies) ? data.companies : []);
        setGrouped(
          data.grouped && typeof data.grouped === 'object' ? data.grouped : {}
        );
        setSummary(
          data.summary || {
            total_companies: 0,
            total_employees: 0,
            total_pending_leaves: 0,
            total_pending_expenses: 0,
            total_contracts: 0,
            total_open_tasks: 0,
            total_checked_in: 0,
          }
        );
      } else {
        throw new Error(data.error || 'Failed to load companies');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to load companies. Please try again.',
        variant: 'destructive',
      });
      // Set empty state on error
      setCompanies([]);
      setGrouped({});
      setSummary({
        total_companies: 0,
        total_employees: 0,
        total_pending_leaves: 0,
        total_pending_expenses: 0,
        total_contracts: 0,
        total_open_tasks: 0,
        total_checked_in: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToCompany = async (companyId: string) => {
    try {
      const response = await fetch('/api/user/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (response.ok) {
        router.push(`/${locale}/employer/team`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error switching company:', error);
    }
  };

  const handleEditClick = (company: CompanyData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCompany(company);
    setEditFormData({ name: company.name, description: '' });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (company: CompanyData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCompany || !editFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/company/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Company updated successfully',
        });
        setIsEditDialogOpen(false);
        setEditingCompany(null);
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to update company');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;

    setSaving(true);
    try {
      // First switch to the company to delete it
      await fetch('/api/user/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: deletingCompany.id }),
      });

      // Then delete it (soft delete by setting is_active = false)
      const response = await fetch(`/api/company/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Company deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setDeletingCompany(null);
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to delete company');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete company',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Company created successfully',
        });
        setIsCreateDialogOpen(false);
        setCreateFormData({ name: '', description: '' });
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to create company');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user's highest role across all companies for permission checks
  const userHighestRole =
    companies.length > 0 && companies[0]
      ? companies.reduce((highest, company) => {
          const roleOrder = {
            owner: 3,
            admin: 2,
            manager: 1,
            hr: 0,
            member: -1,
          };
          const currentOrder =
            roleOrder[
              company.user_role.toLowerCase() as keyof typeof roleOrder
            ] ?? -1;
          const highestOrder =
            roleOrder[highest.toLowerCase() as keyof typeof roleOrder] ?? -1;
          return currentOrder > highestOrder ? company.user_role : highest;
        }, companies[0].user_role)
      : 'member';

  // Filter and sort companies
  const getFilteredCompanies = (companyList: CompanyData[]) => {
    const result = companyList.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'employees':
          return (b.stats.employees || 0) - (a.stats.employees || 0);
        case 'attendance':
          const aRate =
            a.stats.employees > 0
              ? (a.stats.checked_in_today / a.stats.employees) * 100
              : 0;
          const bRate =
            b.stats.employees > 0
              ? (b.stats.checked_in_today / b.stats.employees) * 100
              : 0;
          return bRate - aRate;
        default:
          return 0;
      }
    });

    return result;
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-3'>
            <BarChart3 className='h-8 w-8 text-indigo-600' />
            Cross-Company Dashboard
          </h1>
          <p className='text-gray-500 mt-1'>
            Overview of all your companies at a glance
          </p>
        </div>
        {canCreateCompany(userHighestRole) && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Company
          </Button>
        )}
      </div>

      {/* Compact Summary Cards */}
      {summary && (
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3'>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Companies
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_companies || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <Building2 size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Employees
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_employees || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <Users size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Checked In
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_checked_in || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <Clock size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Pending Leaves
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_pending_leaves || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <Calendar size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Pending Expenses
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_pending_expenses || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <DollarSign size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Active Contracts
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_contracts || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <FileText size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Open Tasks
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary.total_open_tasks || '—'}
                </p>
              </div>
              <div className='ml-4 p-2 bg-gray-50 rounded-lg'>
                <CheckSquare size={18} className='text-gray-600' />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
        <div className='flex items-center gap-4 w-full sm:w-auto'>
          <div className='relative flex-1 sm:w-80'>
            <Search
              size={18}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <Input
              type='text'
              placeholder='Search companies...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm'
            />
          </div>
          <div className='flex items-center gap-2 border-l border-gray-200 pl-4'>
            <Filter size={18} className='text-gray-400' />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className='bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer border-0'
              aria-label='Sort companies by'
            >
              <option value='name'>Sort by Name</option>
              <option value='employees'>Sort by Employees</option>
              <option value='attendance'>Sort by Attendance</option>
            </select>
          </div>
        </div>

        <div className='flex items-center gap-3 w-full sm:w-auto justify-end'>
          <div className='flex items-center bg-gray-100 p-1 rounded-lg'>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label='Switch to grid view'
              title='Grid view'
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label='Switch to list view'
              title='List view'
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Companies by Group */}
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([groupName, groupCompanies]) => {
          const filtered = getFilteredCompanies(groupCompanies);
          if (filtered.length === 0) return null;

          const isExpanded = expandedGroups.has(groupName);

          return (
            <div key={groupName} className='space-y-3'>
              <button
                onClick={() => toggleGroup(groupName)}
                className='flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors'
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${groupName} group`}
                {...(isExpanded
                  ? { 'aria-expanded': 'true' }
                  : { 'aria-expanded': 'false' })}
              >
                {isExpanded ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
                <span>{groupName}</span>
                <Badge variant='outline'>{filtered.length}</Badge>
              </button>

              {isExpanded && viewMode === 'grid' && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {filtered.map(company => {
                    const canEdit = canEditCompany(
                      userHighestRole,
                      company.user_role
                    );
                    const canDelete = canDeleteCompany(
                      userHighestRole,
                      company.user_role
                    );

                    return (
                      <Card
                        key={company.id}
                        className='group hover:shadow-lg transition-all duration-200 border border-gray-200'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start justify-between mb-4'>
                            <div className='flex items-center gap-3 flex-1 min-w-0'>
                              <Avatar
                                className='h-10 w-10 cursor-pointer flex-shrink-0'
                                onClick={() =>
                                  handleSwitchToCompany(company.id)
                                }
                              >
                                {company.logo_url ? (
                                  <AvatarImage src={company.logo_url} />
                                ) : null}
                                <AvatarFallback className='text-sm font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                                  {getInitials(company.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                <h3
                                  className='font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors'
                                  onClick={() =>
                                    handleSwitchToCompany(company.id)
                                  }
                                  title={company.name}
                                >
                                  {company.name}
                                </h3>
                                <Badge
                                  className={cn(
                                    'mt-1 text-xs',
                                    roleColors[
                                      company.user_role.toLowerCase()
                                    ] || roleColors.member
                                  )}
                                >
                                  {company.user_role}
                                </Badge>
                              </div>
                            </div>
                            {(canEdit || canDelete) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors opacity-0 group-hover:opacity-100'
                                    aria-label={`More options for ${company.name}`}
                                    title='More options'
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSwitchToCompany(company.id)
                                    }
                                  >
                                    <ArrowRight size={14} className='mr-2' />
                                    Go to Dashboard
                                  </DropdownMenuItem>
                                  {canEdit && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={e => {
                                          if (e && 'button' in e) {
                                            handleEditClick(
                                              company,
                                              e as React.MouseEvent<
                                                Element,
                                                MouseEvent
                                              >
                                            );
                                          }
                                        }}
                                      >
                                        <Edit size={14} className='mr-2' />
                                        Edit Company
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          router.push(
                                            `/${locale}/settings/company`
                                          )
                                        }
                                      >
                                        <Settings size={14} className='mr-2' />
                                        Company Settings
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          router.push(
                                            `/${locale}/dashboard/companies/permissions?company_id=${company.id}`
                                          )
                                        }
                                      >
                                        <Shield size={14} className='mr-2' />
                                        Manage Permissions
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={e => {
                                          if (e && 'button' in e) {
                                            handleDeleteClick(
                                              company,
                                              e as React.MouseEvent<
                                                Element,
                                                MouseEvent
                                              >
                                            );
                                          }
                                        }}
                                        className='text-red-600'
                                      >
                                        <Trash2 size={14} className='mr-2' />
                                        Delete Company
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Compact Stats Grid */}
                          <div className='grid grid-cols-3 gap-2 mb-3'>
                            <div className='text-center p-2 bg-gray-50 rounded'>
                              <p className='text-lg font-bold text-gray-900'>
                                {company.stats.employees || '—'}
                              </p>
                              <p className='text-xs text-gray-500'>Employees</p>
                            </div>
                            <div className='text-center p-2 bg-green-50 rounded'>
                              <p className='text-lg font-bold text-green-700'>
                                {company.stats.checked_in_today || '—'}
                              </p>
                              <p className='text-xs text-green-600'>Present</p>
                            </div>
                            <div className='text-center p-2 bg-orange-50 rounded'>
                              <p className='text-lg font-bold text-orange-700'>
                                {company.stats.open_tasks || '—'}
                              </p>
                              <p className='text-xs text-orange-600'>Tasks</p>
                            </div>
                          </div>

                          {/* Attendance Progress */}
                          {company.stats.employees > 0 && (
                            <div className='space-y-1'>
                              <div className='flex items-center justify-between text-xs'>
                                <span className='text-gray-600'>
                                  Attendance
                                </span>
                                <span className='font-medium text-gray-900'>
                                  {Math.round(
                                    (company.stats.checked_in_today /
                                      company.stats.employees) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={
                                  (company.stats.checked_in_today /
                                    company.stats.employees) *
                                  100
                                }
                                className='h-1.5'
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {isExpanded && viewMode === 'list' && (
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
                  <table className='w-full'>
                    <thead className='bg-gray-50 border-b border-gray-200'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Company
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Employees
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Present
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Attendance
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Tasks
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {filtered.map(company => {
                        const canEdit = canEditCompany(
                          userHighestRole,
                          company.user_role
                        );
                        const canDelete = canDeleteCompany(
                          userHighestRole,
                          company.user_role
                        );
                        const attendanceRate: number =
                          company.stats.employees > 0
                            ? Math.round(
                                (company.stats.checked_in_today /
                                  company.stats.employees) *
                                  100
                              )
                            : 0;

                        return (
                          <tr
                            key={company.id}
                            className='border-b border-gray-100 hover:bg-gray-50 transition-colors group'
                          >
                            <td className='px-4 py-3'>
                              <div className='flex items-center gap-3'>
                                <Avatar
                                  className='h-10 w-10 cursor-pointer'
                                  onClick={() =>
                                    handleSwitchToCompany(company.id)
                                  }
                                >
                                  {company.logo_url ? (
                                    <AvatarImage src={company.logo_url} />
                                  ) : null}
                                  <AvatarFallback className='text-sm font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                                    {getInitials(company.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p
                                    className='font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors'
                                    onClick={() =>
                                      handleSwitchToCompany(company.id)
                                    }
                                  >
                                    {company.name}
                                  </p>
                                  <Badge
                                    className={cn(
                                      'mt-1 text-xs',
                                      roleColors[
                                        company.user_role.toLowerCase()
                                      ] || roleColors.member
                                    )}
                                  >
                                    {company.user_role}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-600'>
                              {company.stats.employees || '—'}
                            </td>
                            <td className='px-4 py-3'>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-medium text-green-600'>
                                  {company.stats.checked_in_today || '—'}
                                </span>
                                {company.stats.employees > 0 && (
                                  <span className='text-xs text-gray-400'>
                                    / {company.stats.employees}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className='px-4 py-3'>
                              {company.stats.employees > 0 ? (
                                <div className='flex items-center gap-2'>
                                  <div className='flex-1 w-20'>
                                    <Progress
                                      value={attendanceRate}
                                      className='h-1.5'
                                    />
                                  </div>
                                  <span className='text-xs font-medium text-gray-600 w-10 text-right'>
                                    {attendanceRate}%
                                  </span>
                                </div>
                              ) : (
                                <span className='text-sm text-gray-400'>—</span>
                              )}
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-600'>
                              {company.stats.open_tasks || '—'}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <div className='flex items-center justify-end gap-2'>
                                <button
                                  onClick={() =>
                                    handleSwitchToCompany(company.id)
                                  }
                                  className='text-sm font-medium text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity'
                                >
                                  Manage
                                </button>
                                {(canEdit || canDelete) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100'
                                        aria-label={`More options for ${company.name}`}
                                        title='More options'
                                      >
                                        <MoreVertical size={16} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleSwitchToCompany(company.id)
                                        }
                                      >
                                        <ArrowRight
                                          size={14}
                                          className='mr-2'
                                        />
                                        Go to Dashboard
                                      </DropdownMenuItem>
                                      {canEdit && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={e => {
                                              if (e && 'button' in e) {
                                                handleEditClick(
                                                  company,
                                                  e as React.MouseEvent<
                                                    Element,
                                                    MouseEvent
                                                  >
                                                );
                                              }
                                            }}
                                          >
                                            <Edit size={14} className='mr-2' />
                                            Edit Company
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {canDelete && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={e => {
                                              if (e && 'button' in e) {
                                                handleDeleteClick(
                                                  company,
                                                  e as React.MouseEvent<
                                                    Element,
                                                    MouseEvent
                                                  >
                                                );
                                              }
                                            }}
                                            className='text-red-600'
                                          >
                                            <Trash2
                                              size={14}
                                              className='mr-2'
                                            />
                                            Delete Company
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      ) : companies.length > 0 ? (
        // If we have companies but no groups, show them all
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-semibold'>All Companies</h2>
            <Badge variant='outline'>
              {getFilteredCompanies(companies).length}
            </Badge>
          </div>
          {viewMode === 'grid' ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {getFilteredCompanies(companies).map(company => {
                const canEdit = canEditCompany(
                  userHighestRole,
                  company.user_role
                );
                const canDelete = canDeleteCompany(
                  userHighestRole,
                  company.user_role
                );

                return (
                  <Card
                    key={company.id}
                    className='group hover:shadow-xl transition-all duration-300 border-0 shadow-md relative'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-4'>
                        <Avatar
                          className='h-14 w-14 shadow-lg cursor-pointer'
                          onClick={() => handleSwitchToCompany(company.id)}
                        >
                          {company.logo_url ? (
                            <AvatarImage src={company.logo_url} />
                          ) : null}
                          <AvatarFallback className='text-lg font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                            {getInitials(company.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <CardTitle className='flex items-center gap-2 text-lg'>
                            <span
                              className='truncate cursor-pointer'
                              onClick={() => handleSwitchToCompany(company.id)}
                            >
                              {company.name}
                            </span>
                            <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600' />
                          </CardTitle>
                          <Badge
                            className={cn(
                              'mt-1',
                              roleColors[company.user_role] || roleColors.member
                            )}
                          >
                            {company.user_role}
                          </Badge>
                        </div>
                        {(canEdit || canDelete) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={e => {
                                  if (e) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    if (e && 'button' in e) {
                                      handleEditClick(
                                        company,
                                        e as React.MouseEvent<
                                          Element,
                                          MouseEvent
                                        >
                                      );
                                    }
                                  }}
                                >
                                  <Edit className='h-4 w-4 mr-2' />
                                  Edit Company
                                </DropdownMenuItem>
                              )}
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/${locale}/settings/company`)
                                  }
                                >
                                  <Settings className='h-4 w-4 mr-2' />
                                  Company Settings
                                </DropdownMenuItem>
                              )}
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/${locale}/dashboard/companies/permissions?company_id=${company.id}`
                                    )
                                  }
                                >
                                  <Shield className='h-4 w-4 mr-2' />
                                  Manage Permissions
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      if (e && 'button' in e) {
                                        handleDeleteClick(
                                          company,
                                          e as React.MouseEvent<
                                            Element,
                                            MouseEvent
                                          >
                                        );
                                      }
                                    }}
                                    className='text-red-600 focus:text-red-600'
                                  >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Delete Company
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent
                      className='space-y-4'
                      onClick={() => handleSwitchToCompany(company.id)}
                    >
                      {/* Stats Grid */}
                      <div className='grid grid-cols-3 gap-3'>
                        <div className='text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                          <Users className='h-4 w-4 mx-auto text-blue-600 mb-1' />
                          <p className='text-lg font-bold'>
                            {company.stats.employees}
                          </p>
                          <p className='text-xs text-gray-500'>Employees</p>
                        </div>
                        <div className='text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                          <Clock className='h-4 w-4 mx-auto text-emerald-600 mb-1' />
                          <p className='text-lg font-bold'>
                            {company.stats.checked_in_today}
                          </p>
                          <p className='text-xs text-gray-500'>Present</p>
                        </div>
                        <div className='text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                          <CheckSquare className='h-4 w-4 mx-auto text-amber-600 mb-1' />
                          <p className='text-lg font-bold'>
                            {company.stats.open_tasks}
                          </p>
                          <p className='text-xs text-gray-500'>Tasks</p>
                        </div>
                      </div>

                      {/* Pending Items */}
                      {(company.stats.pending_leaves > 0 ||
                        company.stats.pending_expenses > 0 ||
                        company.stats.pending_reviews > 0) && (
                        <div className='flex flex-wrap gap-2'>
                          {company.stats.pending_leaves > 0 && (
                            <Badge
                              variant='outline'
                              className='gap-1 text-amber-600 border-amber-200 bg-amber-50'
                            >
                              <AlertTriangle className='h-3 w-3' />
                              {company.stats.pending_leaves} leave requests
                            </Badge>
                          )}
                          {company.stats.pending_expenses > 0 && (
                            <Badge
                              variant='outline'
                              className='gap-1 text-rose-600 border-rose-200 bg-rose-50'
                            >
                              <AlertTriangle className='h-3 w-3' />
                              {company.stats.pending_expenses} expenses
                            </Badge>
                          )}
                          {company.stats.pending_reviews > 0 && (
                            <Badge
                              variant='outline'
                              className='gap-1 text-purple-600 border-purple-200 bg-purple-50'
                            >
                              <Star className='h-3 w-3' />
                              {company.stats.pending_reviews} reviews
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Attendance Progress */}
                      {company.stats.employees > 0 && (
                        <div className='space-y-1'>
                          <div className='flex justify-between text-xs text-gray-500'>
                            <span>Today's Attendance</span>
                            <span>
                              {Math.round(
                                (company.stats.checked_in_today /
                                  company.stats.employees) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (company.stats.checked_in_today /
                                company.stats.employees) *
                              100
                            }
                            className='h-2'
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Company
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Employees
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Present
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Attendance
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Tasks
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {getFilteredCompanies(companies).map(company => {
                    const canEdit = canEditCompany(
                      userHighestRole,
                      company.user_role
                    );
                    const canDelete = canDeleteCompany(
                      userHighestRole,
                      company.user_role
                    );
                    const attendanceRate: number =
                      company.stats.employees > 0
                        ? Math.round(
                            (company.stats.checked_in_today /
                              company.stats.employees) *
                              100
                          )
                        : 0;

                    return (
                      <tr
                        key={company.id}
                        className='border-b border-gray-100 hover:bg-gray-50 transition-colors group'
                      >
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            <Avatar
                              className='h-10 w-10 cursor-pointer'
                              onClick={() => handleSwitchToCompany(company.id)}
                            >
                              {company.logo_url ? (
                                <AvatarImage src={company.logo_url} />
                              ) : null}
                              <AvatarFallback className='text-sm font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                                {getInitials(company.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p
                                className='font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors'
                                onClick={() =>
                                  handleSwitchToCompany(company.id)
                                }
                              >
                                {company.name}
                              </p>
                              <Badge
                                className={cn(
                                  'mt-1 text-xs',
                                  roleColors[company.user_role.toLowerCase()] ||
                                    roleColors.member
                                )}
                              >
                                {company.user_role}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-600'>
                          {company.stats.employees || '—'}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium text-green-600'>
                              {company.stats.checked_in_today || '—'}
                            </span>
                            {company.stats.employees > 0 && (
                              <span className='text-xs text-gray-400'>
                                / {company.stats.employees}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          {company.stats.employees > 0 ? (
                            <div className='flex items-center gap-2'>
                              <div className='flex-1 w-20'>
                                <Progress
                                  value={attendanceRate}
                                  className='h-1.5'
                                />
                              </div>
                              <span className='text-xs font-medium text-gray-600 w-10 text-right'>
                                {attendanceRate}%
                              </span>
                            </div>
                          ) : (
                            <span className='text-sm text-gray-400'>—</span>
                          )}
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-600'>
                          {company.stats.open_tasks || '—'}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => handleSwitchToCompany(company.id)}
                              className='text-sm font-medium text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                              Manage
                            </button>
                            {(canEdit || canDelete) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100'
                                    aria-label={`More options for ${company.name}`}
                                    title='More options'
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSwitchToCompany(company.id)
                                    }
                                  >
                                    <ArrowRight size={14} className='mr-2' />
                                    Go to Dashboard
                                  </DropdownMenuItem>
                                  {canEdit && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={e => {
                                          if (e && 'button' in e) {
                                            handleEditClick(
                                              company,
                                              e as React.MouseEvent<
                                                Element,
                                                MouseEvent
                                              >
                                            );
                                          }
                                        }}
                                      >
                                        <Edit size={14} className='mr-2' />
                                        Edit Company
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={e => {
                                          if (e && 'button' in e) {
                                            handleDeleteClick(
                                              company,
                                              e as React.MouseEvent<
                                                Element,
                                                MouseEvent
                                              >
                                            );
                                          }
                                        }}
                                        className='text-red-600'
                                      >
                                        <Trash2 size={14} className='mr-2' />
                                        Delete Company
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Empty State for Search */}
      {companies.length > 0 &&
        searchTerm &&
        getFilteredCompanies(companies).length === 0 && (
          <div className='text-center py-12 bg-white rounded-lg border border-gray-200'>
            <p className='text-gray-500 text-lg'>No companies found</p>
            <p className='text-gray-400 text-sm mt-1'>
              Try adjusting your search or filters
            </p>
          </div>
        )}

      {/* Empty State */}
      {companies.length === 0 && (
        <Card className='border-dashed'>
          <CardContent className='py-12 text-center'>
            <Building2 className='h-12 w-12 mx-auto text-gray-400 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No Companies Yet</h3>
            <p className='text-gray-500 mb-4'>
              Create your first company to get started
            </p>
            {canCreateCompany(userHighestRole) && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Create Company
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Company Name</Label>
              <Input
                id='edit-name'
                value={editFormData.name}
                onChange={e =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder='Enter company name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-description'>Description (Optional)</Label>
              <Input
                id='edit-description'
                value={editFormData.description}
                onChange={e =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder='Enter company description'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company to manage your business operations.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='create-name'>Company Name *</Label>
              <Input
                id='create-name'
                value={createFormData.name}
                onChange={e =>
                  setCreateFormData({ ...createFormData, name: e.target.value })
                }
                placeholder='Enter company name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='create-description'>Description (Optional)</Label>
              <Input
                id='create-description'
                value={createFormData.description}
                onChange={e =>
                  setCreateFormData({
                    ...createFormData,
                    description: e.target.value,
                  })
                }
                placeholder='Enter company description'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company "{deletingCompany?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className='bg-red-600 hover:bg-red-700'
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
