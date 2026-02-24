'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter , useParams} from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Search,
} from 'lucide-react';
import { UserCreateForm } from '@/components/user-management/user-create-form';

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  permissions: string[];
  status: string;
  phone?: string;
  department?: string;
  position?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

interface UserStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  admins: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminContext {
  roles: string[];
  permissions: string[];
}

interface PermissionDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  resource?: string;
  action?: string;
  scope?: string;
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deleted', label: 'Deleted' },
];

export default function UserManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    admins: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [context, setContext] = useState<AdminContext>({
    roles: [],
    permissions: [],
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionLibrary, setPermissionLibrary] = useState<
    PermissionDefinition[]
  >([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [permissionDialogError, setPermissionDialogError] = useState('');
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionDialogUser, setPermissionDialogUser] = useState<User | null>(
    null
  );
  const [permissionSelection, setPermissionSelection] = useState<Set<string>>(
    new Set()
  );
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionSaving, setPermissionSaving] = useState(false);
  const _router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput, supabase]);

  useEffect(() => {
    if (!supabase) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionsLoading(true);
        setPermissionsError('');
        const response = await fetch('/api/users/permissions', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch permissions');
        }
        setPermissionLibrary(
          Array.isArray(data.permissions) ? data.permissions : []
        );
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissionsError(
          error instanceof Error ? error.message : 'Failed to load permissions'
        );
      } finally {
        setPermissionsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const fetchUsers = async (options?: { skipGlobalLoading?: boolean }) => {
    try {
      if (!options?.skipGlobalLoading) {
        setLoading(true);
      }
      setError('');

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', pagination.limit.toString());

      const response = await fetch(
        `/api/users/management?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      const normalizedUsers = (
        Array.isArray(data.users) ? data.users : []
      ) as User[];

      setUsers(
        normalizedUsers.map(user => ({
          ...user,
          roles: user.roles || [],
          permissions: user.permissions || [],
        }))
      );
      setStats(
        data.stats || {
          total: 0,
          active: 0,
          pending: 0,
          inactive: 0,
          admins: 0,
        }
      );
      setPagination(
        data.pagination || {
          page: 1,
          limit: pagination.limit,
          total: data.users?.length || 0,
          totalPages: 1,
        }
      );
      setContext(
        data.context || {
          roles: [],
          permissions: [],
        }
      );
    } catch (fetchError) {
      console.error('Error fetching users:', fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch users'
      );
      setUsers([]);
    } finally {
      if (!options?.skipGlobalLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const handleUserAction = async (
    action: string,
    userId: string,
    value?: string
  ) => {
    try {
      setActionLoading(userId);
      setError('');
      setSuccess('');

      const response = await fetch('/api/users/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId,
          role: action === 'update_role' ? value : undefined,
          status: action === 'update_status' ? value : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setSuccess(data.message || 'Action completed');
      await fetchUsers({ skipGlobalLoading: true }); // Refresh the list
    } catch (error) {
      console.error('Error performing action:', error);
      setError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
      deleted: 'bg-gray-200 text-gray-700',
    };
    return (
      <Badge
        className={
          variants[status as keyof typeof variants] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-teal-100 text-teal-800',
      promoter: 'bg-green-100 text-green-800',
      viewer: 'bg-slate-100 text-slate-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge
        className={
          variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800'
        }
      >
        {role}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Loading users...</p>
        </div>

        {permissionsError && (
          <p className='text-sm text-red-500'>{permissionsError}</p>
        )}
      </div>
    );
  }

  const renderRoleBadges = (roles: string[], userId: string) => {
    if (!roles || roles.length === 0) {
      return <span key={`${userId}-unassigned`}>{getRoleBadge('user')}</span>;
    }
    return roles.map(role => (
      <span key={`${userId}-${role}`}>{getRoleBadge(role)}</span>
    ));
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchUsers({ skipGlobalLoading: true });
  };

  const primaryRole = (user: User) => user.roles[0] || 'user';

  const openPermissionDialog = (user: User) => {
    setPermissionDialogUser(user);
    setPermissionSelection(new Set(user.permissions || []));
    setPermissionSearch('');
    setPermissionDialogError('');
    setPermissionDialogOpen(true);
  };

  const closePermissionDialog = () => {
    setPermissionDialogOpen(false);
    setPermissionDialogUser(null);
    setPermissionSelection(new Set());
    setPermissionSearch('');
    setPermissionSaving(false);
    setPermissionDialogError('');
  };

  const togglePermission = (permissionName: string) => {
    setPermissionSelection(prev => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  };

  const filteredPermissions = permissionLibrary.filter(permission => {
    if (!permissionSearch.trim()) return true;
    const search = permissionSearch.toLowerCase();
    return (
      permission.name.toLowerCase().includes(search) ||
      (permission.description || '').toLowerCase().includes(search) ||
      `${permission.resource}:${permission.action}`
        .toLowerCase()
        .includes(search)
    );
  });

  const groupedPermissions = filteredPermissions.reduce<
    Record<string, PermissionDefinition[]>
  >((acc, permission) => {
    const key =
      permission.category ||
      permission.resource ||
      permission.action ||
      'general';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(permission);
    return acc;
  }, {});

  const handleSavePermissions = async () => {
    if (!permissionDialogUser) return;
    if (permissionSelection.size === 0) {
      setPermissionDialogError('Select at least one permission');
      return;
    }

    try {
      setPermissionSaving(true);
      setPermissionDialogError('');
      const response = await fetch('/api/users/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign_permissions',
          userId: permissionDialogUser.id,
          permissions: Array.from(permissionSelection),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign permissions');
      }

      setSuccess(data.message || 'Permissions updated successfully');
      closePermissionDialog();
      await fetchUsers({ skipGlobalLoading: true });
    } catch (error) {
      console.error('Error assigning permissions:', error);
      setPermissionDialogError(
        error instanceof Error ? error.message : 'Failed to assign permissions'
      );
    } finally {
      setPermissionSaving(false);
    }
  };

  return (
    <>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-6 space-y-4'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                  <Users className='h-8 w-8' />
                  User Management
                </h1>
                <p className='text-gray-600 mt-2'>
                  Manage user accounts, roles, and permissions
                </p>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' asChild>
                  <Link href={`/${locale}/dashboard`}>Dashboard</Link>
                </Button>
                <UserCreateForm onSuccess={() => fetchUsers()} />
                <Button onClick={handleManualRefresh} disabled={loading}>
                  {loading || isRefreshing ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>

            <div className='flex flex-col gap-4 md:flex-row md:items-center'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  placeholder='Search by email, name, or phone'
                  className='pl-9'
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={value => setRoleFilter(value)}
              >
                <SelectTrigger className='w-full md:w-48'>
                  <SelectValue placeholder='Filter by role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All roles</SelectItem>
                  {ROLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value)}
              >
                <SelectTrigger className='w-full md:w-48'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {permissionsError && (
            <p className='text-sm text-red-500'>{permissionsError}</p>
          )}

          {error && (
            <Alert className='mb-6' variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className='mb-6 border-green-200 bg-green-50'>
              <AlertDescription className='text-green-800'>
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Total Users</p>
                    <p className='text-2xl font-semibold'>{stats.total}</p>
                  </div>
                  <Users className='h-8 w-8 text-gray-400' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Active</p>
                    <p className='text-2xl font-semibold text-green-600'>
                      {stats.active}
                    </p>
                  </div>
                  <UserCheck className='h-8 w-8 text-green-500' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Pending</p>
                    <p className='text-2xl font-semibold text-yellow-600'>
                      {stats.pending}
                    </p>
                  </div>
                  <UserX className='h-8 w-8 text-yellow-500' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-500'>Admins</p>
                    <p className='text-2xl font-semibold text-purple-600'>
                      {stats.admins}
                    </p>
                  </div>
                  <Shield className='h-8 w-8 text-purple-500' />
                </div>
              </CardContent>
            </Card>
          </div>

          {context.roles.length > 0 && (
            <p className='mb-4 text-sm text-gray-600'>
              You have access as:{' '}
              <span className='font-medium'>
                {context.roles.join(', ') || 'user'}
              </span>
            </p>
          )}

          <div className='grid gap-6'>
            {users.map(user => (
              <Card key={user.id}>
                <CardHeader>
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div>
                      <CardTitle className='text-lg'>
                        {user.full_name || 'Unnamed user'}
                      </CardTitle>
                      <p className='text-sm text-gray-600 flex items-center gap-1 mt-1'>
                        <Mail className='h-4 w-4' />
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className='text-sm text-gray-600 flex items-center gap-1 mt-1'>
                          <Phone className='h-4 w-4' />
                          {user.phone}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {getStatusBadge(user.status)}
                      {renderRoleBadges(user.roles, user.id)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex flex-wrap gap-4 text-sm text-gray-500'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        <span>Created: {formatDate(user.created_at)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        <span>Updated: {formatDate(user.updated_at)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        <span>
                          Last sign-in: {formatDate(user.last_sign_in_at)}
                        </span>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      {user.status === 'pending' && (
                        <>
                          <Button
                            size='sm'
                            onClick={() => handleUserAction('approve', user.id)}
                            disabled={actionLoading === user.id}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <UserCheck className='h-4 w-4' />
                            )}
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => handleUserAction('reject', user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <UserX className='h-4 w-4' />
                            )}
                            Reject
                          </Button>
                        </>
                      )}

                      <Select
                        value={primaryRole(user)}
                        onValueChange={value =>
                          handleUserAction('update_role', user.id, value)
                        }
                        disabled={actionLoading === user.id}
                      >
                        <SelectTrigger className='w-40'>
                          <SelectValue placeholder='Set role' />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={user.status}
                        onValueChange={value =>
                          handleUserAction('update_status', user.id, value)
                        }
                        disabled={actionLoading === user.id}
                      >
                        <SelectTrigger className='w-40'>
                          <SelectValue placeholder='Set status' />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => openPermissionDialog(user)}
                        disabled={permissionsLoading}
                      >
                        Manage Permissions
                      </Button>
                    </div>

                    <div className='text-xs text-muted-foreground'>
                      {user.permissions && user.permissions.length > 0 ? (
                        <span>
                          Permissions: {user.permissions.slice(0, 6).join(', ')}
                          {user.permissions.length > 6 ? '…' : ''}
                        </span>
                      ) : (
                        <span>No custom permissions assigned.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {users.length === 0 && !loading && (
            <Card className='mt-6'>
              <CardContent className='text-center py-8'>
                <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No users found
                </h3>
                <p className='text-gray-600'>
                  Try adjusting the filters or search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={permissionDialogOpen}
        onOpenChange={open => {
          if (!open) {
            closePermissionDialog();
          }
        }}
      >
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              {permissionDialogUser
                ? `Select specific permissions for ${permissionDialogUser.email}`
                : 'Select specific permissions for the user.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <Input
              placeholder='Search permissions'
              value={permissionSearch}
              onChange={e => setPermissionSearch(e.target.value)}
            />
            {permissionDialogError && (
              <p className='text-sm text-red-500'>{permissionDialogError}</p>
            )}
            <div className='max-h-[24rem] overflow-y-auto space-y-4 pr-1'>
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => (
                  <div key={category} className='space-y-2'>
                    <Label className='text-sm font-semibold capitalize'>
                      {category.replace(/_/g, ' ')}
                    </Label>
                    <div className='space-y-2'>
                      {permissions.map(permission => {
                        const checked = permissionSelection.has(
                          permission.name
                        );
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                              checked
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                togglePermission(permission.name)
                              }
                            />
                            <div className='space-y-1'>
                              <p className='font-medium'>{permission.name}</p>
                              <p className='text-xs text-muted-foreground'>
                                {permission.description ||
                                  `${permission.resource}:${permission.action}`}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
              {Object.keys(groupedPermissions).length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  {permissionsLoading
                    ? 'Loading permissions…'
                    : 'No permissions match your search.'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closePermissionDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={permissionSaving || permissionSelection.size === 0}
            >
              {permissionSaving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving…
                </>
              ) : (
                'Save Permissions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
