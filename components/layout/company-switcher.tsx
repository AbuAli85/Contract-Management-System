'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserRoleState } from '@/hooks/useUserRole';
import { useCompany, RawCompany } from '@/components/providers/company-provider';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  hr: 'bg-pink-100 text-pink-700',
  provider: 'bg-amber-100 text-amber-700',
  client: 'bg-cyan-100 text-cyan-700',
  viewer: 'bg-gray-100 text-gray-500',
  member: 'bg-gray-100 text-gray-700',
};

export function CompanySwitcher() {
  const [switchingToId, setSwitchingToId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { toast } = useToast();

  // FIX: Use useUserRoleState (reads from user_roles table) instead of profiles.role
  const { role: currentRole, isLoading: roleLoading } = useUserRoleState();

  const {
    company: activeCompany,
    rawCompanies,
    switchCompany,
    isLoading: providerLoading,
    loadError,
    isSwitching,
    refreshCompany,
  } = useCompany();

  // FIX: Derive canCreateCompany from user_roles, not legacy profiles.role
  const nonCreatorRoles = new Set(['promoter', 'user', 'viewer', 'client']);
  const canCreateCompany =
    !roleLoading &&
    !nonCreatorRoles.has(currentRole ?? '') &&
    (rawCompanies.length === 0 ||
      !nonCreatorRoles.has(rawCompanies[0]?.user_role ?? ''));

  const handleSwitch = async (companyId: string) => {
    if (isSwitching || switchingToId) return;
    if (companyId === activeCompany?.id) return;

    setSwitchingToId(companyId);
    try {
      await switchCompany(companyId);
    } catch (error: any) {
      const message = error?.message || 'Failed to switch company';
      toast({
        title: 'Switch failed',
        description: message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setSwitchingToId(null);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/user/companies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create company');
      }

      toast({
        title: 'Company Created',
        description: `${newCompany.name} has been created successfully`,
      });

      setCreateDialogOpen(false);
      setNewCompany({ name: '', description: '' });

      // Refresh context to pick up the new company, then switch to it
      await refreshCompany();
      if (data.company?.id) {
        await handleSwitch(data.company.id);
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

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Loading state
  if (providerLoading) {
    return (
      <Button variant='ghost' className='gap-2' disabled>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='hidden md:inline text-sm text-gray-500'>Loading...</span>
      </Button>
    );
  }

  // No companies — show create button for eligible roles, or error/empty with Retry
  if (rawCompanies.length === 0) {
    if (canCreateCompany && !loadError) {
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
    // No companies and not eligible to create, or load error: show Company dropdown with Retry
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='gap-2 px-3 h-10 hover:bg-gray-100 dark:hover:bg-gray-800'
              aria-label='Company'
            >
              <Building2 className='h-4 w-4 shrink-0 text-muted-foreground' />
              <span className='hidden md:inline max-w-[150px] truncate text-sm text-muted-foreground'>
                {loadError ? 'Retry' : 'No company'}
              </span>
              <ChevronDown className='h-4 w-4 text-gray-500 shrink-0' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[300px]'>
            <DropdownMenuLabel className='font-normal'>
              <p className='text-sm font-medium'>
                {loadError ? 'Couldn’t load companies' : 'No company selected'}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                {loadError
                  ? loadError
                  : canCreateCompany
                    ? 'You don’t have access to any company yet. Create one below or ask an admin to add you.'
                    : 'You don’t have access to any company yet. Ask an admin to add you to a company.'}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => refreshCompany()}
              className='flex items-center gap-2 cursor-pointer'
            >
              <RefreshCw className='h-4 w-4' />
              <span>Retry</span>
            </DropdownMenuItem>
            {canCreateCompany && (
              <DropdownMenuItem
                onClick={() => setCreateDialogOpen(true)}
                className='flex items-center gap-2 cursor-pointer'
              >
                <Plus className='h-4 w-4' />
                <span>Create company</span>
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

  const isAnySwitching = isSwitching || switchingToId !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='gap-2 px-3 h-10 hover:bg-gray-100 dark:hover:bg-gray-800'
            disabled={isAnySwitching}
            aria-label={activeCompany ? `Current company: ${activeCompany.name}. Switch company` : 'Select company'}
            aria-busy={isAnySwitching}
          >
            {isAnySwitching ? (
              <Loader2 className='h-4 w-4 animate-spin text-blue-500 shrink-0' aria-hidden />
            ) : (
              <Avatar className='h-6 w-6 shrink-0'>
                {activeCompany?.logo_url ? (
                  <AvatarImage src={activeCompany.logo_url} alt="" />
                ) : null}
                <AvatarFallback className='text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                  {activeCompany ? getInitials(activeCompany.name) : '?'}
                </AvatarFallback>
              </Avatar>
            )}
            <span className='hidden md:inline max-w-[150px] truncate font-medium text-sm'>
              {activeCompany?.name || 'Select Company'}
            </span>
            <ChevronDown className='h-4 w-4 text-gray-500 shrink-0' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-[300px]'>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col space-y-0.5'>
                <p className='text-sm font-medium'>Your Companies</p>
                <p className='text-xs text-gray-500'>
                  {rawCompanies.length} {rawCompanies.length === 1 ? 'company' : 'companies'}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={(e) => {
                  e.stopPropagation();
                  refreshCompany();
                }}
                title='Refresh companies'
              >
                <RefreshCw className='h-3.5 w-3.5 text-gray-400' />
              </Button>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {rawCompanies.map(company => {
            const isActive = company.company_id === activeCompany?.id;
            const isThisSwitching = switchingToId === company.company_id;

            return (
              <DropdownMenuItem
                key={company.company_id}
                onClick={() => handleSwitch(company.company_id)}
                // FIX: Disable all items while any switch is in progress
                disabled={isAnySwitching}
                className={cn(
                  'flex items-center gap-3 p-3 cursor-pointer',
                  isActive && 'bg-blue-50 dark:bg-blue-950/20',
                  isAnySwitching && !isThisSwitching && 'opacity-50'
                )}
              >
                <div className='relative'>
                  <Avatar className='h-8 w-8'>
                    {company.company_logo ? (
                      <AvatarImage src={company.company_logo} alt={company.company_name} />
                    ) : null}
                    <AvatarFallback className='text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                      {getInitials(company.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* FIX: Show spinner on the specific company being switched to */}
                  {isThisSwitching && (
                    <div className='absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 rounded-full'>
                      <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm font-medium truncate'>
                      {company.company_name}
                    </p>
                    {isActive && !isThisSwitching && (
                      <Check className='h-4 w-4 text-green-600 flex-shrink-0' />
                    )}
                  </div>
                  <div className='flex items-center gap-2 flex-wrap mt-0.5'>
                    <Badge
                      className={cn(
                        'text-xs px-1.5 py-0 border-0',
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
                            {company.stats.employees === 1 ? 'employee' : 'employees'}
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
                      <span className='text-xs text-gray-400 truncate'>
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
            );
          })}

          {canCreateCompany && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateDialogOpen(true)}
                disabled={isAnySwitching}
                className='flex items-center gap-2 p-3 cursor-pointer'
              >
                <div className='h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                  <Plus className='h-4 w-4' />
                </div>
                <span className='text-sm'>Create New Company</span>
              </DropdownMenuItem>
            </>
          )}

          {activeCompany && (
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/settings/company`)}
              disabled={isAnySwitching}
              className='flex items-center gap-2 p-3 cursor-pointer'
            >
              <div className='h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                <Settings className='h-4 w-4' />
              </div>
              <span className='text-sm'>Company Settings</span>
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
            <Label htmlFor='company-name'>Company Name *</Label>
            <Input
              id='company-name'
              placeholder='e.g., Falcon Eye Technologies'
              value={newCompany.name}
              onChange={e =>
                setNewCompany(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='company-description'>Description</Label>
            <Textarea
              id='company-description'
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
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
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
