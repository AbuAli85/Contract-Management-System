'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Shield,
  Activity,
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getRoleDisplay, ROLE_HIERARCHY } from '@/lib/role-hierarchy';

interface UserProfileModalProps {
  user: unknown;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  mode: 'view' | 'edit';
}

const ROLES = [
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Highest level - can do everything',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage users, system settings',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage teams, promoters',
  },
  {
    value: 'moderator',
    label: 'Moderator',
    description: 'Can moderate content, basic admin tasks',
  },
  { value: 'user', label: 'User', description: 'Basic user permissions' },
  { value: 'guest', label: 'Guest', description: 'Lowest level - read-only' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
  },
];

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  mode,
}: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: (user as unknown as { email?: string })?.email || '',
    role: (user as unknown as { role?: string })?.role || 'user',
    status: (user as unknown as { status?: string })?.status || 'active',
    full_name: (user as unknown as { full_name?: string })?.full_name || '',
    phone: (user as unknown as { phone?: string })?.phone || '',
    department: (user as unknown as { department?: string })?.department || '',
    position: (user as unknown as { position?: string })?.position || '',
    avatar_url: (user as unknown as { avatar_url?: string })?.avatar_url || '',
    notes: (user as unknown as { notes?: string })?.notes || '',
    permissions:
      (user as unknown as { permissions?: Record<string, boolean> })
        ?.permissions || {},
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        email: (user as unknown as { email?: string })?.email || '',
        role: (user as unknown as { role?: string })?.role || 'user',
        status: (user as unknown as { status?: string })?.status || 'active',
        full_name: (user as unknown as { full_name?: string })?.full_name || '',
        phone: (user as unknown as { phone?: string })?.phone || '',
        department:
          (user as unknown as { department?: string })?.department || '',
        position: (user as unknown as { position?: string })?.position || '',
        avatar_url:
          (user as unknown as { avatar_url?: string })?.avatar_url || '',
        notes: (user as unknown as { notes?: string })?.notes || '',
        permissions:
          (user as unknown as { permissions?: Record<string, boolean> })
            ?.permissions || {},
      });
      fetchUserActivity();
      fetchUserStats();
    }
  }, [user, isOpen]);

  const fetchUserActivity = async () => {
    const userId = (user as unknown as { id?: string })?.id;
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setUserActivity(data);
      }
    } catch (error) {
    }
  };

  const fetchUserStats = async () => {
    const userId = (user as unknown as { id?: string })?.id;
    if (!user || !userId) return;

    try {
      // Fetch user statistics
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, status')
        .eq('user_id', userId);

      const { data: parties, error: partiesError } = await supabase
        .from('parties')
        .select('id')
        .eq('owner_id', userId);

      if (!contractsError && !partiesError) {
        setUserStats({
          totalContracts: contracts?.length || 0,
          activeContracts:
            contracts?.filter(
              (c: { id: string; status: string }) => c.status === 'active'
            ).length || 0,
          totalParties: parties?.length || 0,
          lastActivity: userActivity[0]?.created_at || null,
        });
      }
    } catch (error) {
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const userId = (user as unknown as { id?: string })?.id;
      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID is missing.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('app_users')
        .update({
          email: formData.email,
          role: formData.role,
          status: formData.status,
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          avatar_url: formData.avatar_url,
          notes: formData.notes,
          permissions: formData.permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'User updated successfully',
        description: 'The user profile has been updated.',
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Note: This would require admin privileges to change user passwords
      // In a real implementation, you'd need to use Supabase admin functions
      toast({
        title: 'Password change not implemented',
        description: 'Password changes require admin privileges.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error changing password',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            {mode === 'view' ? 'User Profile' : 'Edit User Profile'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue='profile' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
            <TabsTrigger value='permissions'>Permissions</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-4'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='h-4 w-4' />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-16 w-16'>
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback>
                        {getInitials(formData.full_name || formData.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <Label htmlFor='full_name'>Full Name</Label>
                      <Input
                        id='full_name'
                        value={formData.full_name}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        disabled={mode === 'view'}
                        placeholder='Enter full name'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={mode === 'view'}
                      placeholder='Enter email address'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone</Label>
                    <Input
                      id='phone'
                      value={formData.phone}
                      onChange={e =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={mode === 'view'}
                      placeholder='Enter phone number'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='department'>Department</Label>
                      <Input
                        id='department'
                        value={formData.department}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        disabled={mode === 'view'}
                        placeholder='Department'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='position'>Position</Label>
                      <Input
                        id='position'
                        value={formData.position}
                        onChange={e =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        disabled={mode === 'view'}
                        placeholder='Position'
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='h-4 w-4' />
                    Role & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='role'>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={value =>
                        setFormData({ ...formData, role: value })
                      }
                      disabled={mode === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className='font-medium'>{role.label}</div>
                              <div className='text-sm text-gray-500'>
                                {role.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value =>
                        setFormData({ ...formData, status: value })
                      }
                      disabled={mode === 'view'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='notes'>Notes</Label>
                    <Textarea
                      id='notes'
                      value={formData.notes}
                      onChange={e =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      disabled={mode === 'view'}
                      placeholder='Add notes about this user'
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-4 w-4' />
                  User Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {userStats.totalContracts}
                    </div>
                    <div className='text-sm text-gray-500'>Total Contracts</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {userStats.activeContracts}
                    </div>
                    <div className='text-sm text-gray-500'>
                      Active Contracts
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {userStats.totalParties}
                    </div>
                    <div className='text-sm text-gray-500'>Managed Parties</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-orange-600'>
                      {userStats.lastActivity ? 'Yes' : 'No'}
                    </div>
                    <div className='text-sm text-gray-500'>Recent Activity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='activity' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-4 w-4' />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userActivity.length > 0 ? (
                  <div className='space-y-3'>
                    {userActivity.map(activity => (
                      <div
                        key={activity.id}
                        className='flex items-center gap-3 rounded-lg border p-3'
                      >
                        <div className='flex-1'>
                          <div className='font-medium'>{activity.action}</div>
                          <div className='text-sm text-gray-500'>
                            {activity.entity_type} •{' '}
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant='outline'>{activity.entity_type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='py-8 text-center text-gray-500'>
                    No recent activity found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='permissions' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-4 w-4' />
                  Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-3'>
                      <h4 className='font-medium'>Contract Management</h4>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>Create Contracts</span>
                          <Switch
                            checked={
                              formData.permissions?.createContracts || false
                            }
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  createContracts: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>Edit Contracts</span>
                          <Switch
                            checked={
                              formData.permissions?.editContracts || false
                            }
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  editContracts: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>Delete Contracts</span>
                          <Switch
                            checked={
                              formData.permissions?.deleteContracts || false
                            }
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  deleteContracts: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <h4 className='font-medium'>User Management</h4>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>View Users</span>
                          <Switch
                            checked={formData.permissions?.viewUsers || false}
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  viewUsers: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>Edit Users</span>
                          <Switch
                            checked={formData.permissions?.editUsers || false}
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  editUsers: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm'>Delete Users</span>
                          <Switch
                            checked={formData.permissions?.deleteUsers || false}
                            onCheckedChange={checked =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  deleteUsers: checked,
                                },
                              })
                            }
                            disabled={mode === 'view'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='security' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Key className='h-4 w-4' />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <div className='relative'>
                    <Input
                      id='newPassword'
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder='Enter new password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm Password</Label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder='Confirm new password'
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={loading || !newPassword || !confirmPassword}
                  className='w-full'
                >
                  {loading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Key className='mr-2 h-4 w-4' />
                  )}
                  Change Password
                </Button>

                <Separator />

                <div className='space-y-2'>
                  <h4 className='font-medium'>Account Status</h4>
                  <div className='flex items-center gap-2'>
                    {getStatusBadge(formData.status)}
                    <span className='text-sm text-gray-500'>
                      {formData.status === 'active'
                        ? 'Account is active and can access the system'
                        : formData.status === 'inactive'
                          ? 'Account is inactive and cannot access the system'
                          : formData.status === 'suspended'
                            ? 'Account is suspended due to policy violation'
                            : 'Account is pending activation'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={onClose}>
            <X className='mr-2 h-4 w-4' />
            Cancel
          </Button>
          {mode === 'edit' && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-2 h-4 w-4' />
              )}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
