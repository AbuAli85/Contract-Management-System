'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastHelpers } from '@/components/toast-notifications';
import { Shield, Edit, Trash2, XCircle, Loader2, Plus } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  created_at: string;
  is_system: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export default function RolesAndPermissionsPage() {
  const { canManageUsers } = usePermissions();

  // Use toast helpers at the top level (React Hooks rule)
  const { success, error } = useToastHelpers();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Fetch roles and permissions
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles
      const rolesResponse = await fetch('/api/roles');
      const rolesData = await rolesResponse.json();

      // Fetch permissions
      const permissionsResponse = await fetch('/api/permissions');
      const permissionsData = await permissionsResponse.json();

      if (rolesData.success) {
        setRoles(rolesData.roles);
      }

      if (permissionsData.success) {
        setPermissions(permissionsData.permissions);
      }
    } catch (err) {
      error('Error fetching data', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check permissions (after hooks)
  if (!canManageUsers()) {
    return (
      <div className='container mx-auto p-6'>
        <Alert>
          <XCircle className='h-4 w-4' />
          <AlertDescription>
            You don't have permission to access roles and permissions. Please
            contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle role creation
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        success('Role created successfully');
        setCreateDialog(false);
        setFormData({ name: '', description: '', permissions: [] });
        fetchData();
      } else {
        error('Failed to create role', data.error);
      }
    } catch (err) {
      error('Error creating role', 'An unexpected error occurred');
    }
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        success('Role updated successfully');
        setEditDialog(false);
        setSelectedRole(null);
        setFormData({ name: '', description: '', permissions: [] });
        fetchData();
      } else {
        error('Failed to update role', data.error);
      }
    } catch (err) {
      error('Error updating role', 'An unexpected error occurred');
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this role? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        success('Role deleted successfully');
        fetchData();
      } else {
        error('Failed to delete role', data.error);
      }
    } catch (err) {
      error('Error deleting role', 'An unexpected error occurred');
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const category = permission.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='mr-2 animate-spin' /> Loading roles and
        permissions...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Roles & Permissions</h1>
          <p className='text-muted-foreground'>
            Manage user roles and their associated permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {roles.map(role => (
          <Card key={role.id} className='transition-shadow hover:shadow-md'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-primary' />
                  <CardTitle className='text-lg'>{role.name}</CardTitle>
                  {role.is_system && <Badge variant='secondary'>System</Badge>}
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setSelectedRole(role);
                      setFormData({
                        name: role.name,
                        description: role.description,
                        permissions: role.permissions,
                      });
                      setEditDialog(true);
                    }}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                  {!role.is_system && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Users:</span>
                  <span className='font-medium'>{role.userCount}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Permissions:</span>
                  <span className='font-medium'>{role.permissions.length}</span>
                </div>
                <div className='pt-2'>
                  <div className='mb-2 text-sm text-muted-foreground'>
                    Key Permissions:
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions to it.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='role-name'>Role Name</Label>
              <Input
                id='role-name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Enter role name'
              />
            </div>
            <div>
              <Label htmlFor='role-description'>Description</Label>
              <Input
                id='role-description'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter role description'
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className='max-h-60 space-y-3 overflow-y-auto rounded-md border p-3'>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className='mb-2 text-sm font-medium'>{category}</h4>
                    <div className='space-y-2'>
                      {perms.map(permission => (
                        <label
                          key={permission.id}
                          className='flex items-center space-x-2'
                        >
                          <input
                            type='checkbox'
                            checked={formData.permissions.includes(
                              permission.id
                            )}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [
                                    ...formData.permissions,
                                    permission.id,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter(
                                    p => p !== permission.id
                                  ),
                                });
                              }
                            }}
                          />
                          <span className='text-sm'>
                            {permission.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify the role and its permissions.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='edit-role-name'>Role Name</Label>
              <Input
                id='edit-role-name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Enter role name'
              />
            </div>
            <div>
              <Label htmlFor='edit-role-description'>Description</Label>
              <Input
                id='edit-role-description'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter role description'
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className='max-h-60 space-y-3 overflow-y-auto rounded-md border p-3'>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className='mb-2 text-sm font-medium'>{category}</h4>
                    <div className='space-y-2'>
                      {perms.map(permission => (
                        <label
                          key={permission.id}
                          className='flex items-center space-x-2'
                        >
                          <input
                            type='checkbox'
                            checked={formData.permissions.includes(
                              permission.id
                            )}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [
                                    ...formData.permissions,
                                    permission.id,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter(
                                    p => p !== permission.id
                                  ),
                                });
                              }
                            }}
                          />
                          <span className='text-sm'>
                            {permission.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
