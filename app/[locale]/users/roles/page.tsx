'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { usePermissions } from '@/hooks/use-permissions';
import {
  Shield,
  Users,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Crown,
  Briefcase,
  User,
  Monitor,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department?: string;
  position?: string;
  last_login?: string;
}

export default function RolesAndPermissionsPage() {
  const pathname = usePathname();
  const locale = pathname ? pathname.split('/')[1] || 'en' : 'en';
  const { canManageUsers, canAssignRoles } = usePermissions();

  // Safe toast usage with error handling
  const [toastHelpers, setToastHelpers] = useState<any>(null);

  useEffect(() => {
    try {
      const { useToastHelpers } = require('@/components/toast-notifications');
      setToastHelpers(useToastHelpers());
    } catch (error) {
      console.warn('Toast context not available:', error);
      setToastHelpers({
        success: (title: string, message?: string) =>
          console.log('Success:', title, message),
        error: (title: string, message?: string) =>
          console.error('Error:', title, message),
        warning: (title: string, message?: string) =>
          console.warn('Warning:', title, message),
        info: (title: string, message?: string) =>
          console.log('Info:', title, message),
      });
    }
  }, []);

  const { success, error, warning } = toastHelpers || {
    success: (title: string, message?: string) =>
      console.log('Success:', title, message),
    error: (title: string, message?: string) =>
      console.error('Error:', title, message),
    warning: (title: string, message?: string) =>
      console.warn('Warning:', title, message),
    info: (title: string, message?: string) =>
      console.log('Info:', title, message),
  };

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles, permissions, and users in parallel
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        fetch('/api/users/roles'),
        fetch('/api/users/permissions'),
        fetch('/api/users'),
      ]);

      const [rolesData, permissionsData, usersData] = await Promise.all([
        rolesRes.json(),
        permissionsRes.json(),
        usersRes.json(),
      ]);

      // Debug logging
      console.log('Roles API response:', rolesData);
      console.log('Permissions API response:', permissionsData);
      console.log('Users API response:', usersData);

      if (rolesData.success) setRoles(rolesData.roles);
      if (permissionsData.success) setPermissions(permissionsData.permissions);

      // Fix: Handle users data properly - check for both possible response formats
      if (usersData.users) {
        setUsers(usersData.users);
      } else if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.warn('Unexpected users data format:', usersData);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      error(
        'Failed to fetch data',
        'An error occurred while loading roles and permissions'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get role icon
  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, any> = {
      admin: Crown,
      manager: Briefcase,
      user: User,
      viewer: Eye,
    };
    return icons[roleName.toLowerCase()] || Users;
  };

  // Get role color
  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      colors[roleName.toLowerCase()] ||
      'bg-gray-100 text-gray-800 border-gray-200'
    );
  };

  // Filter permissions by category
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || permission.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce(
    (acc, permission) => {
      const category = permission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  // Create new role
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });

      const data = await response.json();

      if (data.success) {
        success(
          'Role created successfully',
          'The new role has been created and is ready to use'
        );
        setIsCreateDialogOpen(false);
        setNewRole({ name: '', description: '', permissions: [] });
        fetchData();
      } else {
        error('Failed to create role', data.error);
      }
    } catch (err) {
      error('Error creating role', 'An unexpected error occurred');
    }
  };

  // Update role
  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`/api/users/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole),
      });

      const data = await response.json();

      if (data.success) {
        success(
          'Role updated successfully',
          'The role has been updated with new permissions'
        );
        setIsEditDialogOpen(false);
        setEditingRole(null);
        fetchData();
      } else {
        error('Failed to update role', data.error);
      }
    } catch (err) {
      error('Error updating role', 'An unexpected error occurred');
    }
  };

  // Delete role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/users/roles/${selectedRole.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        success(
          'Role deleted successfully',
          'The role has been permanently deleted'
        );
        setIsDeleteDialogOpen(false);
        setSelectedRole(null);
        fetchData();
      } else {
        error('Failed to delete role', data.error);
      }
    } catch (err) {
      error('Error deleting role', 'An unexpected error occurred');
    }
  };

  // Toggle permission
  const togglePermission = (
    permissionId: string,
    rolePermissions: string[]
  ) => {
    const isGranted = rolePermissions.includes(permissionId);
    if (isGranted) {
      return rolePermissions.filter(p => p !== permissionId);
    } else {
      return [...rolePermissions, permissionId];
    }
  };

  // Export roles
  const exportRoles = () => {
    const csvContent = [
      ['Role Name', 'Description', 'Permissions', 'User Count', 'Created At'],
      ...roles.map(role => [
        role.name,
        role.description,
        role.permissions.join('; '),
        role.userCount.toString(),
        new Date(role.createdAt).toLocaleDateString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Check permissions - moved after all hooks
  if (!canManageUsers() || !canAssignRoles()) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <Lock className='mx-auto mb-4 h-12 w-12 text-gray-400' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Access Denied
              </h3>
              <p className='text-gray-600'>
                You don't have permission to manage roles and permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          <span className='ml-2 text-gray-600'>
            Loading roles and permissions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Roles & Permissions
          </h1>
          <p className='mt-2 text-gray-600'>
            Manage user roles and system permissions with full administrative
            control
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Shield className='h-8 w-8 text-blue-600' />
          <Badge variant='outline' className='px-3 py-1 text-lg'>
            {roles && Array.isArray(roles) ? roles.length : 0} Roles
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Create Role
          </Button>
          <Button onClick={exportRoles} variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
          <Button onClick={fetchData} variant='outline'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
        <div className='text-sm text-gray-600'>
          {users.length} total users • {permissions.length} permissions
        </div>
      </div>

      <Tabs defaultValue='roles' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='roles'>Roles Overview</TabsTrigger>
          <TabsTrigger value='permissions'>Permissions Management</TabsTrigger>
        </TabsList>

        <TabsContent value='roles' className='space-y-6'>
          {/* Roles Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {roles.map(role => {
              const IconComponent = getRoleIcon(role.name);
              const roleColor = getRoleColor(role.name);

              return (
                <Card
                  key={role.id}
                  className='group relative transition-shadow hover:shadow-lg'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className={`rounded-lg p-2 ${roleColor}`}>
                          <IconComponent className='h-5 w-5' />
                        </div>
                        <div>
                          <CardTitle className='text-lg'>{role.name}</CardTitle>
                          <Badge variant='secondary' className='text-xs'>
                            {role.userCount} users
                          </Badge>
                        </div>
                      </div>
                      {!role.isSystem && (
                        <div className='opacity-0 transition-opacity group-hover:opacity-100'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setEditingRole(role);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedRole(role);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className='mb-3'>
                      {role.description}
                    </CardDescription>
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>
                        Permissions ({role.permissions.length})
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {role.permissions.slice(0, 3).map(permission => (
                          <Badge
                            key={permission}
                            variant='outline'
                            className='text-xs'
                          >
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant='outline' className='text-xs'>
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    {role.isSystem && (
                      <div className='mt-3 flex items-center gap-1 text-xs text-gray-500'>
                        <Shield className='h-3 w-3' />
                        System Role
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value='permissions' className='space-y-6'>
          {/* Permissions Filters */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Filter className='h-5 w-5' />
                Permissions Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='search'>Search Permissions</Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      id='search'
                      placeholder='Search permissions...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='category'>Filter by Category</Label>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Categories</SelectItem>
                      <SelectItem value='User Management'>
                        User Management
                      </SelectItem>
                      <SelectItem value='Promoter Management'>
                        Promoter Management
                      </SelectItem>
                      <SelectItem value='Party Management'>
                        Party Management
                      </SelectItem>
                      <SelectItem value='Contract Management'>
                        Contract Management
                      </SelectItem>
                      <SelectItem value='Dashboard & Analytics'>
                        Dashboard & Analytics
                      </SelectItem>
                      <SelectItem value='System Administration'>
                        System Administration
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions by Category */}
          <div className='space-y-6'>
            {Object.entries(permissionsByCategory).map(
              ([category, categoryPermissions]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      {category}
                      <Badge variant='secondary'>
                        {categoryPermissions.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                      {categoryPermissions.map(permission => (
                        <div
                          key={permission.id}
                          className='flex items-center justify-between rounded-lg border p-3'
                        >
                          <div>
                            <div className='text-sm font-medium'>
                              {permission.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {permission.description}
                            </div>
                          </div>
                          {permission.isSystem && (
                            <Badge variant='outline' className='text-xs'>
                              System
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions. System roles cannot
              be modified.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='roleName'>Role Name</Label>
              <Input
                id='roleName'
                placeholder='Enter role name...'
                value={newRole.name}
                onChange={e =>
                  setNewRole(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='roleDescription'>Description</Label>
              <Textarea
                id='roleDescription'
                placeholder="Describe the role's purpose..."
                value={newRole.description}
                onChange={e =>
                  setNewRole(prev => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Permissions</Label>
              <div className='max-h-60 space-y-2 overflow-y-auto'>
                {Object.entries(permissionsByCategory).map(
                  ([category, categoryPermissions]) => (
                    <div key={category} className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>
                        {category}
                      </div>
                      <div className='grid grid-cols-1 gap-2'>
                        {categoryPermissions.map(permission => (
                          <div
                            key={permission.id}
                            className='flex items-center space-x-2'
                          >
                            <Switch
                              checked={newRole.permissions.includes(
                                permission.id
                              )}
                              onCheckedChange={() => {
                                setNewRole(prev => ({
                                  ...prev,
                                  permissions: togglePermission(
                                    permission.id,
                                    prev.permissions
                                  ),
                                }));
                              }}
                            />
                            <Label className='text-sm'>
                              {permission.name}
                              <span className='ml-1 text-gray-500'>
                                - {permission.description}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRole.name.trim()}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Modify the role's permissions. Changes will affect all users with
              this role.
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='editRoleName'>Role Name</Label>
                <Input
                  id='editRoleName'
                  value={editingRole.name}
                  onChange={e =>
                    setEditingRole(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='editRoleDescription'>Description</Label>
                <Textarea
                  id='editRoleDescription'
                  value={editingRole.description}
                  onChange={e =>
                    setEditingRole(prev =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Permissions</Label>
                <div className='max-h-60 space-y-2 overflow-y-auto'>
                  {Object.entries(permissionsByCategory).map(
                    ([category, categoryPermissions]) => (
                      <div key={category} className='space-y-2'>
                        <div className='text-sm font-medium text-gray-700'>
                          {category}
                        </div>
                        <div className='grid grid-cols-1 gap-2'>
                          {categoryPermissions.map(permission => (
                            <div
                              key={permission.id}
                              className='flex items-center space-x-2'
                            >
                              <Switch
                                checked={editingRole.permissions.includes(
                                  permission.id
                                )}
                                onCheckedChange={() => {
                                  setEditingRole(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          permissions: togglePermission(
                                            permission.id,
                                            prev.permissions
                                          ),
                                        }
                                      : null
                                  );
                                }}
                              />
                              <Label className='text-sm'>
                                {permission.name}
                                <span className='ml-1 text-gray-500'>
                                  - {permission.description}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!editingRole?.name.trim()}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            <div className='text-sm text-red-700'>
              <strong>Warning:</strong> This will affect{' '}
              {selectedRole?.userCount} users currently assigned to this role.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
