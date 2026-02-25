'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
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

interface AdminRoleManagerProps {
  className?: string;
}

export function AdminRoleManager({ className }: AdminRoleManagerProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [employerId, setEmployerId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');

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
    } catch (error) {
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

  // Get available employer IDs
  const [employers, setEmployers] = useState<
    Array<{ id: string; name_en: string }>
  >([]);

  const fetchEmployerIds = async () => {
    try {
      const { data } = await supabase
        .from('parties')
        .select('id, name_en')
        .eq('type', 'Employer')
        .order('name_en');
      if (data) setEmployers(data);
      return data || [];
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    fetchEmployerIds();
  }, []);

  // Determine user's effective role
  const getUserEffectiveRole = (user: User): string => {
    const metadataRole = user.user_metadata?.role;
    const profileRole = user.role;

    if (profileRole === 'admin') return 'Admin';
    if (profileRole === 'manager' || metadataRole === 'employer')
      return 'Employer';
    if (metadataRole === 'promoter' || metadataRole === 'employee')
      return 'Employee';
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
      const updates: any = {};
      const metadataUpdates: Record<string, any> = {
        ...selectedUser.user_metadata,
      };

      switch (newRole) {
        case 'employee':
          updates.role = 'user';
          metadataUpdates.role = 'promoter';
          // Remove employer fields
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
          toast({
            title: 'Error',
            description: 'Invalid role selected',
            variant: 'destructive',
          });
          return;
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

      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      setEmployerId('');
      setCompanyId('');
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  // Filter users
  const filteredUsers = users.filter(
    user =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserEffectiveRole(user)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Count users by role
  const roleCounts = {
    admin: users.filter(u => getUserEffectiveRole(u) === 'Admin').length,
    employer: users.filter(u => getUserEffectiveRole(u) === 'Employer').length,
    employee: users.filter(u => getUserEffectiveRole(u) === 'Employee').length,
    unassigned: users.filter(u => getUserEffectiveRole(u) === 'Unassigned')
      .length,
  };

  return (
    <div className={className}>
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                <Shield className='h-6 w-6 text-primary' />
                User Role Management
              </CardTitle>
              <CardDescription className='mt-2'>
                Manage user roles and permissions for the Promoter Intelligence
                Hub
              </CardDescription>
            </div>
            <Button onClick={fetchUsers} variant='outline' size='sm'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-6 space-y-6'>
          {/* Statistics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Card className='border-2 border-purple-200 bg-purple-50/50'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-purple-700'>
                  {roleCounts.admin}
                </div>
                <div className='text-sm text-purple-600 mt-1'>Admins</div>
              </CardContent>
            </Card>
            <Card className='border-2 border-blue-200 bg-blue-50/50'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-blue-700'>
                  {roleCounts.employer}
                </div>
                <div className='text-sm text-blue-600 mt-1'>Employers</div>
              </CardContent>
            </Card>
            <Card className='border-2 border-green-200 bg-green-50/50'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-green-700'>
                  {roleCounts.employee}
                </div>
                <div className='text-sm text-green-600 mt-1'>Employees</div>
              </CardContent>
            </Card>
            <Card className='border-2 border-gray-200 bg-gray-50/50'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-gray-700'>
                  {roleCounts.unassigned}
                </div>
                <div className='text-sm text-gray-600 mt-1'>Unassigned</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search users by email or role...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Email
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Current Role
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Profile Role
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Metadata
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Last Sign In
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-4 py-8 text-center text-muted-foreground'
                      >
                        <RefreshCw className='h-5 w-5 animate-spin mx-auto mb-2' />
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-4 py-8 text-center text-muted-foreground'
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const effectiveRole = getUserEffectiveRole(user);
                      return (
                        <tr
                          key={user.id}
                          className='hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        >
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
                            <div className='space-y-1'>
                              {user.user_metadata?.role && (
                                <div>Role: {user.user_metadata.role}</div>
                              )}
                              {user.user_metadata?.employer_id && (
                                <div className='text-xs'>
                                  Employer:{' '}
                                  {user.user_metadata.employer_id.substring(
                                    0,
                                    8
                                  )}
                                  ...
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>
                            {user.last_sign_in_at
                              ? new Date(
                                  user.last_sign_in_at
                                ).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className='px-4 py-3'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole('');
                                setEmployerId(
                                  user.user_metadata?.employer_id || ''
                                );
                                setCompanyId(
                                  user.user_metadata?.company_id || ''
                                );
                                setIsDialogOpen(true);
                              }}
                            >
                              <UserCheck className='h-4 w-4 mr-2' />
                              Manage
                            </Button>
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

      {/* Role Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Change user role and permissions for {selectedUser?.email}
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
                      <UserCheck className='h-4 w-4 text-green-600' />
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
                  <Label>Select Employer</Label>
                  <Select value={employerId} onValueChange={setEmployerId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select an employer' />
                    </SelectTrigger>
                    <SelectContent>
                      {employers.map(employer => (
                        <SelectItem key={employer.id} value={employer.id}>
                          {employer.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Or enter UUID manually below
                  </p>
                  <Input
                    placeholder='Or enter employer UUID manually'
                    value={employerId}
                    onChange={e => setEmployerId(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Company ID (Optional)</Label>
                  <Input
                    placeholder='Enter company UUID'
                    value={companyId}
                    onChange={e => setCompanyId(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className='bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-4 w-4 text-blue-600 mt-0.5' />
                <div className='text-sm text-blue-800 dark:text-blue-200'>
                  <strong>Note:</strong> User will need to logout and login
                  again for changes to take effect.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!newRole}>
              <CheckCircle className='h-4 w-4 mr-2' />
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
