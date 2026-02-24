'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-service';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCompany } from '@/components/providers/company-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Settings,
  Users,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Company {
  company_id: string;
  company_name: string;
  company_logo: string | null;
  user_role: string;
  is_primary: boolean;
  group_name: string | null;
  stats?: {
    employees: number;
    attendance_today: number;
    active_tasks: number;
    contracts: number;
  };
  features?: {
    team_management: boolean;
    attendance: boolean;
    tasks: boolean;
    targets: boolean;
    reports: boolean;
    contracts: boolean;
    analytics: boolean;
  };
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  hr: 'bg-pink-100 text-pink-700',
  member: 'bg-gray-100 text-gray-700',
};

export function CompanySwitcher() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const {
    company: activeCompanyFromProvider,
    switchCompany: switchCompanyFromProvider,
    isLoading: providerLoading,
    refreshCompany,
  } = useCompany();

  // Determine if user can create companies (not promoters/employees)
  const userMetadata = (user?.user_metadata || {}) as Record<string, any>;
  const userRole = userProfile?.role || userMetadata?.role || '';
  const isPromoter = userRole === 'promoter' || userRole === 'user';
  const canCreateCompany =
    !isPromoter &&
    (companies.length > 0
      ? !['promoter', 'user'].includes(companies[0]?.user_role || '')
      : true); // If no companies, allow creation (will be checked by API)

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Listen for company switch events from provider
  useEffect(() => {
    const handleCompanySwitched = () => {
      fetchCompanies();
    };

    window.addEventListener('company-switched', handleCompanySwitched);
    return () => {
      window.removeEventListener('company-switched', handleCompanySwitched);
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/companies', {
        credentials: 'include', // Ensure cookies are sent with the request
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (companyId: string) => {
    const currentActiveId = activeCompanyFromProvider?.id;
    if (companyId === currentActiveId) return;

    setSwitching(true);
    try {
      // Use the provider's switchCompany function to ensure synchronization
      await switchCompanyFromProvider(companyId);

      // Refresh companies list
      await fetchCompanies();

      // The provider already handles router.refresh() and toast notifications
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to switch company',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/user/companies', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent with the request
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Company Created',
        description: `${newCompany.name} has been created successfully`,
      });

      setCreateDialogOpen(false);
      setNewCompany({ name: '', description: '' });
      fetchCompanies();

      // Switch to the new company
      if (data.company?.id) {
        handleSwitch(data.company.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Use active company from provider, fallback to finding from companies list
  const activeCompanyId = activeCompanyFromProvider?.id || null;
  const activeCompany = activeCompanyFromProvider
    ? companies.find(c => c.company_id === activeCompanyFromProvider.id) || {
        company_id: activeCompanyFromProvider.id,
        company_name: activeCompanyFromProvider.name,
        company_logo: activeCompanyFromProvider.logo_url || null,
        user_role: activeCompanyFromProvider.role,
        is_primary: false,
        group_name: null,
      }
    : companies.length > 0
      ? companies[0]
      : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || providerLoading) {
    return (
      <Button variant='ghost' className='gap-2' disabled>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='hidden md:inline'>Loading...</span>
      </Button>
    );
  }

  // If no companies, show create button (only for admins, managers, employers)
  if (companies.length === 0 && canCreateCompany) {
    return (
      <>
        <Button
          variant='outline'
          onClick={() => setCreateDialogOpen(true)}
          className='gap-2'
        >
          <Plus className='h-4 w-4' />
          Create Company
        </Button>
        <CreateCompanyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          newCompany={newCompany}
          setNewCompany={setNewCompany}
          onSubmit={handleCreateCompany}
          creating={creating}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='gap-2 px-3 h-10 hover:bg-gray-100 dark:hover:bg-gray-800'
            disabled={switching}
          >
            {switching ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Avatar className='h-6 w-6'>
                {activeCompany?.company_logo ? (
                  <AvatarImage src={activeCompany.company_logo} />
                ) : null}
                <AvatarFallback className='text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                  {activeCompany
                    ? getInitials(activeCompany.company_name)
                    : '?'}
                </AvatarFallback>
              </Avatar>
            )}
            <span className='hidden md:inline max-w-[150px] truncate font-medium'>
              {activeCompany?.company_name || 'Select Company'}
            </span>
            <ChevronDown className='h-4 w-4 text-gray-500' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[280px]'>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium'>Your Companies</p>
              <p className='text-xs text-gray-500'>Switch between companies</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {companies.map(company => (
            <DropdownMenuItem
              key={company.company_id}
              onClick={() => handleSwitch(company.company_id)}
              className='flex items-center gap-3 p-3 cursor-pointer'
            >
              <Avatar className='h-8 w-8'>
                {company.company_logo ? (
                  <AvatarImage src={company.company_logo} />
                ) : null}
                <AvatarFallback className='text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                  {getInitials(company.company_name)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium truncate'>
                    {company.company_name}
                  </p>
                  {company.company_id === activeCompanyId && (
                    <Check className='h-4 w-4 text-green-600 flex-shrink-0' />
                  )}
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Badge
                    className={cn(
                      'text-xs px-1.5 py-0',
                      roleColors[company.user_role] || roleColors.member
                    )}
                  >
                    {company.user_role}
                  </Badge>
                  {company.stats && (
                    <>
                      {company.stats.employees > 0 && (
                        <span className='text-xs text-gray-500'>
                          {company.stats.employees}{' '}
                          {company.stats.employees === 1
                            ? 'employee'
                            : 'employees'}
                        </span>
                      )}
                      {company.stats.active_tasks > 0 && (
                        <span className='text-xs text-blue-500'>
                          {company.stats.active_tasks} tasks
                        </span>
                      )}
                    </>
                  )}
                  {company.group_name && (
                    <span className='text-xs text-gray-500 truncate'>
                      {company.group_name}
                    </span>
                  )}
                </div>
                {company.features && (
                  <div className='flex items-center gap-1 mt-1 flex-wrap'>
                    {company.features.team_management && (
                      <span className='text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded'>
                        Team
                      </span>
                    )}
                    {company.features.attendance && (
                      <span className='text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded'>
                        Attendance
                      </span>
                    )}
                    {company.features.tasks && (
                      <span className='text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded'>
                        Tasks
                      </span>
                    )}
                    {company.features.contracts && (
                      <span className='text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded'>
                        Contracts
                      </span>
                    )}
                    {company.features.analytics && (
                      <span className='text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded'>
                        Analytics
                      </span>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}

          {canCreateCompany && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateDialogOpen(true)}
                className='flex items-center gap-2 p-3 cursor-pointer'
              >
                <div className='h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                  <Plus className='h-4 w-4' />
                </div>
                <span>Create New Company</span>
              </DropdownMenuItem>
            </>
          )}

          {activeCompany && (
            <DropdownMenuItem
              onClick={() => router.push('/en/settings/company')}
              className='flex items-center gap-2 p-3 cursor-pointer'
            >
              <div className='h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                <Settings className='h-4 w-4' />
              </div>
              <span>Company Settings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCompanyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        newCompany={newCompany}
        setNewCompany={setNewCompany}
        onSubmit={handleCreateCompany}
        creating={creating}
      />
    </>
  );
}

function CreateCompanyDialog({
  open,
  onOpenChange,
  newCompany,
  setNewCompany,
  onSubmit,
  creating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCompany: { name: string; description: string };
  setNewCompany: React.Dispatch<
    React.SetStateAction<{ name: string; description: string }>
  >;
  onSubmit: () => void;
  creating: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5 text-blue-600' />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Add a new company to your account. You can manage multiple companies
            from a single login.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Company Name *</Label>
            <Input
              id='name'
              placeholder='e.g., Falcon Eye Technologies'
              value={newCompany.name}
              onChange={e =>
                setNewCompany(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Brief description of the company...'
              value={newCompany.description}
              onChange={e =>
                setNewCompany(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={creating || !newCompany.name.trim()}
          >
            {creating && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
            Create Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
