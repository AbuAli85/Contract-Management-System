'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
// Separator component - using div instead
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  UserCheck,
  Key,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { useSupabase } from '@/app/providers';

interface User {
  id: string;
  email: string;
  role: string | null;
  user_metadata: Record<string, any>;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource?: string;
  action?: string;
}

interface AdminPermissionManagerProps {
  className?: string;
}

// Promoter-specific permissions
const PROMOTER_PERMISSIONS: Permission[] = [
  {
    id: 'promoter:read',
    name: 'View All Promoters',
    description: 'Can view all promoters in the system',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'read',
  },
  {
    id: 'promoter:read:own',
    name: 'View Own Profile',
    description: 'Can view only their own promoter profile',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'read:own',
  },
  {
    id: 'promoter:create',
    name: 'Create Promoters',
    description: 'Can create new promoters',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'create',
  },
  {
    id: 'promoter:update',
    name: 'Edit Promoters',
    description: 'Can edit promoter information',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'update',
  },
  {
    id: 'promoter:update:own',
    name: 'Edit Own Profile',
    description: 'Can edit only their own promoter profile',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'update:own',
  },
  {
    id: 'promoter:delete',
    name: 'Delete Promoters',
    description: 'Can delete promoters',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'delete',
  },
  {
    id: 'promoter:export',
    name: 'Export Data',
    description: 'Can export promoter data',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'export',
  },
  {
    id: 'promoter:assign',
    name: 'Manage Assignments',
    description: 'Can assign promoters to employers',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'assign',
  },
  {
    id: 'promoter:analytics',
    name: 'View Analytics',
    description: 'Can access analytics dashboard',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'analytics',
  },
  {
    id: 'promoter:bulk',
    name: 'Bulk Actions',
    description: 'Can perform bulk operations on promoters',
    category: 'Promoter Management',
    resource: 'promoter',
    action: 'bulk',
  },
];

// General system permissions
const SYSTEM_PERMISSIONS: Permission[] = [
  {
    id: 'users:view',
    name: 'View Users',
    description: 'Can view user list',
    category: 'User Management',
    resource: 'users',
    action: 'view',
  },
  {
    id: 'users:create',
    name: 'Create Users',
    description: 'Can create new users',
    category: 'User Management',
    resource: 'users',
    action: 'create',
  },
  {
    id: 'users:edit',
    name: 'Edit Users',
    description: 'Can edit user information',
    category: 'User Management',
    resource: 'users',
    action: 'edit',
  },
  {
    id: 'users:delete',
    name: 'Delete Users',
    description: 'Can delete users',
    category: 'User Management',
    resource: 'users',
    action: 'delete',
  },
  {
    id: 'contracts:view',
    name: 'View Contracts',
    description: 'Can view contracts',
    category: 'Contract Management',
    resource: 'contracts',
    action: 'view',
  },
  {
    id: 'contracts:create',
    name: 'Create Contracts',
    description: 'Can create contracts',
    category: 'Contract Management',
    resource: 'contracts',
    action: 'create',
  },
  {
    id: 'contracts:edit',
    name: 'Edit Contracts',
    description: 'Can edit contracts',
    category: 'Contract Management',
    resource: 'contracts',
    action: 'edit',
  },
  {
    id: 'contracts:delete',
    name: 'Delete Contracts',
    description: 'Can delete contracts',
    category: 'Contract Management',
    resource: 'contracts',
    action: 'delete',
  },
];

const ALL_PERMISSIONS = [...PROMOTER_PERMISSIONS, ...SYSTEM_PERMISSIONS];

export function AdminPermissionManager({ className }: AdminPermissionManagerProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [newRole, setNewRole] = useState<string>('');
  const [employerId, setEmployerId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, user_metadata, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch user's current permissions
  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoadingPermissions(true);
      const response = await fetch(`/api/users/${userId}/permissions`);
      const data = await response.json();

      if (response.ok && data.permissions) {
        const permissionIds = data.permissions
          .filter((p: any) => p.granted)
          .map((p: any) => p.permission);
        setUserPermissions(permissionIds);
        setSelectedPermissions(new Set(permissionIds));
      } else {
        setUserPermissions([]);
        setSelectedPermissions(new Set());
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setUserPermissions([]);
      setSelectedPermissions(new Set());
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Open permission management dialog
  const openPermissionDialog = async (user: User) => {
    setSelectedUser(user);
    setIsPermissionDialogOpen(true);
    await fetchUserPermissions(user.id);
  };

  // Open role management dialog
  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole('');
    setEmployerId(user.user_metadata?.employer_id || '');
    setCompanyId(user.user_metadata?.company_id || '');
    setIsRoleDialogOpen(true);
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  // Handle category toggle
  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryPermissions = ALL_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id);

    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        categoryPermissions.forEach(id => newSet.add(id));
      } else {
        categoryPermissions.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await fetch('/api/users/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_permissions',
          userId: selectedUser.id,
          permissions: Array.from(selectedPermissions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign permissions');
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });

      setIsPermissionDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      let updates: any = {};
      let metadataUpdates: Record<string, any> = { ...selectedUser.user_metadata };

      switch (newRole) {
        case 'employee':
          updates.role = 'user';
          metadataUpdates.role = 'promoter';
          delete metadataUpdates.employer_id;
          delete metadataUpdates.company_id;
          break;
        case 'employer':
          updates.role = 'manager';
          metadataUpdates.role = 'employer';
          if (employerId) metadataUpdates.employer_id = employerId;
          if (companyId) metadataUpdates.company_id = companyId;
          break;
        case 'admin':
          updates.role = 'admin';
          metadataUpdates.role = 'admin';
          break;
        default:
          throw new Error('Invalid role selected');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          role: updates.role,
          user_metadata: metadataUpdates,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });

      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      setEmployerId('');
      setCompanyId('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    return ALL_PERMISSIONS.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, []);

  // Filter users
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get user's effective role
  const getUserEffectiveRole = (user: User): string => {
    const metadataRole = user.user_metadata?.role;
    const profileRole = user.role;

    if (profileRole === 'admin') return 'Admin';
    if (profileRole === 'manager' || metadataRole === 'employer') return 'Employer';
    if (metadataRole === 'promoter' || metadataRole === 'employee') return 'Employee';
    return 'Unassigned';
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Employer':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Employee':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className={className}>
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                <Shield className='h-6 w-6 text-primary' />
                Admin Permission Management
              </CardTitle>
              <CardDescription className='mt-2'>
                Manage user roles and granular permissions for the Promoter Intelligence Hub
              </CardDescription>
            </div>
            <Button onClick={fetchUsers} variant='outline' size='sm'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-6 space-y-6'>
          {/* Search */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search users by email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Users Table */}
          <div className='border rounded-lg overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-slate-100 dark:bg-slate-800'>
                  <tr>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>Email</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>Role</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>Profile Role</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>Last Sign In</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className='px-4 py-8 text-center text-muted-foreground'>
                        <RefreshCw className='h-5 w-5 animate-spin mx-auto mb-2' />
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className='px-4 py-8 text-center text-muted-foreground'>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const effectiveRole = getUserEffectiveRole(user);
                      return (
                        <tr key={user.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50'>
                          <td className='px-4 py-3'>
                            <div className='font-medium'>{user.email}</div>
                          </td>
                          <td className='px-4 py-3'>
                            <Badge
                              variant='outline'
                              className={getRoleBadgeColor(effectiveRole)}
                            >
                              {effectiveRole}
                            </Badge>
                          </td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>
                            {user.role || 'N/A'}
                          </td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex gap-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => openRoleDialog(user)}
                                title='Manage Role'
                              >
                                <UserCheck className='h-4 w-4 mr-1' />
                                Role
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => openPermissionDialog(user)}
                                title='Manage Permissions'
                              >
                                <Key className='h-4 w-4 mr-1' />
                                Permissions
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Management Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className='sm:max-w-[700px] max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5' />
              Manage Permissions - {selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              Grant or revoke specific permissions for this user
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='max-h-[60vh] pr-4'>
            {loadingPermissions ? (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw className='h-5 w-5 animate-spin mr-2' />
                Loading permissions...
              </div>
            ) : (
              <div className='space-y-6 py-4'>
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const allSelected = permissions.every(p => selectedPermissions.has(p.id));
                  const someSelected = permissions.some(p => selectedPermissions.has(p.id));

                  return (
                    <div key={category} className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-base font-semibold'>{category}</Label>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) {
                                (el as any).indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onCheckedChange={(checked) =>
                              handleCategoryToggle(category, checked as boolean)
                            }
                          />
                          <span className='text-xs text-muted-foreground'>
                            {permissions.filter(p => selectedPermissions.has(p.id)).length} / {permissions.length}
                          </span>
                        </div>
                      </div>
                      <div className='h-px bg-border my-2' />
                      <div className='space-y-2 pl-4'>
                        {permissions.map(permission => (
                          <div
                            key={permission.id}
                            className='flex items-start justify-between rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800'
                          >
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions.has(permission.id)}
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(permission.id, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={permission.id}
                                  className='font-medium cursor-pointer'
                                >
                                  {permission.name}
                                </Label>
                              </div>
                              <p className='text-sm text-muted-foreground mt-1 ml-6'>
                                {permission.description}
                              </p>
                              {permission.resource && permission.action && (
                                <Badge variant='outline' className='ml-6 mt-1 text-xs'>
                                  {permission.resource}:{permission.action}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving || loadingPermissions}>
              {saving ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className='h-4 w-4 mr-2' />
                  Save Permissions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Change user role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='employee'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-green-600' />
                      Employee - View own profile only
                    </div>
                  </SelectItem>
                  <SelectItem value='employer'>
                    <div className='flex items-center gap-2'>
                      <Building2 className='h-4 w-4 text-blue-600' />
                      Employer - Manage assigned promoters
                    </div>
                  </SelectItem>
                  <SelectItem value='admin'>
                    <div className='flex items-center gap-2'>
                      <Shield className='h-4 w-4 text-purple-600' />
                      Admin - Full system access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRole === 'employer' && (
              <>
                <div className='space-y-2'>
                  <Label>Employer ID (UUID)</Label>
                  <Input
                    placeholder='Enter employer UUID'
                    value={employerId}
                    onChange={(e) => setEmployerId(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Get from parties table where type = 'Employer'
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label>Company ID (Optional)</Label>
                  <Input
                    placeholder='Enter company UUID'
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className='bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-4 w-4 text-blue-600 mt-0.5' />
                <div className='text-sm text-blue-800 dark:text-blue-200'>
                  <strong>Note:</strong> User will need to logout and login again for changes to take effect.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!newRole || saving}>
              {saving ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className='h-4 w-4 mr-2' />
                  Assign Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

