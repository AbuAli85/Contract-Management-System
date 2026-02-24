'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X, Shield, Check, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Permission {
  id: string;
  user_id: string;
  company_id: string;
  permission: string;
  granted: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface CompanyPermissionsManagerProps {
  companyId: string;
  companyName: string;
  onClose?: () => void;
}

const PERMISSIONS = [
  {
    value: 'company:create',
    label: 'Create Companies',
    description: 'Can create new companies',
  },
  {
    value: 'company:edit',
    label: 'Edit Company',
    description: 'Can edit company details',
  },
  {
    value: 'company:delete',
    label: 'Delete Company',
    description: 'Can delete company',
  },
  {
    value: 'company:view',
    label: 'View Company',
    description: 'Can view company information',
  },
  {
    value: 'company:settings',
    label: 'Company Settings',
    description: 'Can manage company settings',
  },
  {
    value: 'company:manage_members',
    label: 'Manage Members',
    description: 'Can add/remove members',
  },
  {
    value: 'company:invite_users',
    label: 'Invite Users',
    description: 'Can invite users to company',
  },
];

export function CompanyPermissionsManager({
  companyId,
  companyName,
  onClose,
}: CompanyPermissionsManagerProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, [companyId]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(
        `/api/company/permissions?company_id=${companyId}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users from company members
      const response = await fetch(`/api/user/companies/${companyId}/members`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedUserId || !selectedPermission) {
      toast({
        title: 'Error',
        description: 'Please select a user and permission',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/company/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          user_id: selectedUserId,
          permission: selectedPermission,
          expires_at: expiresAt || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Permission granted successfully',
        });
        setIsDialogOpen(false);
        setSelectedUserId('');
        setSelectedPermission('');
        setExpiresAt('');
        await fetchPermissions();
      } else {
        throw new Error(data.error || 'Failed to grant permission');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant permission',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokePermission = async (userId: string, permission: string) => {
    try {
      const response = await fetch(
        `/api/company/permissions?company_id=${companyId}&user_id=${userId}&permission=${permission}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Permission revoked successfully',
        });
        await fetchPermissions();
      } else {
        throw new Error(data.error || 'Failed to revoke permission');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke permission',
        variant: 'destructive',
      });
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

  const getUserPermissions = (userId: string) => {
    return permissions.filter(
      p => p.user_id === userId && p.granted && p.is_active
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Company Permissions</h3>
          <p className='text-sm text-gray-500'>{companyName}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className='h-4 w-4 mr-2' />
          Grant Permission
        </Button>
      </div>

      <div className='space-y-4'>
        {users.map(user => {
          const userPerms = getUserPermissions(user.id);
          return (
            <Card key={user.id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(user.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className='text-base'>
                        {user.full_name || user.email}
                      </CardTitle>
                      <p className='text-sm text-gray-500'>{user.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {userPerms.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {userPerms.map(perm => (
                      <Badge
                        key={perm.id}
                        variant='secondary'
                        className='flex items-center gap-1'
                      >
                        <Shield className='h-3 w-3' />
                        {PERMISSIONS.find(p => p.value === perm.permission)
                          ?.label || perm.permission}
                        <button
                          onClick={() =>
                            handleRevokePermission(user.id, perm.permission)
                          }
                          className='ml-1 hover:text-red-600'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-gray-500'>
                    No special permissions assigned
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grant Permission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Permission</DialogTitle>
            <DialogDescription>
              Grant a specific permission to a user for this company.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='user'>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a user' />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='permission'>Permission</Label>
              <Select
                value={selectedPermission}
                onValueChange={setSelectedPermission}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a permission' />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIONS.map(perm => (
                    <SelectItem key={perm.value} value={perm.value}>
                      <div>
                        <div className='font-medium'>{perm.label}</div>
                        <div className='text-xs text-gray-500'>
                          {perm.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expires_at'>Expires At (Optional)</Label>
              <Input
                id='expires_at'
                type='datetime-local'
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
              <p className='text-xs text-gray-500'>
                Leave empty for permanent permission
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantPermission} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Granting...
                </>
              ) : (
                'Grant Permission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
