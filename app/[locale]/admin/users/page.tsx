'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'provider', label: 'Provider' },
  { value: 'client', label: 'Client' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    if (supabase) {
      fetchUsers();
    }
  }, [supabase]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/users/management');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    } finally {
      setLoading(false);
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

      setSuccess(data.message);
      await fetchUsers(); // Refresh the list
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
      inactive: 'bg-red-100 text-red-800',
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
      provider: 'bg-green-100 text-green-800',
      client: 'bg-orange-100 text-orange-800',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
            <Users className='h-8 w-8' />
            User Management
          </h1>
          <p className='text-gray-600 mt-2'>
            Manage user accounts, roles, and permissions
          </p>
        </div>

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

        <div className='grid gap-6'>
          {users.map(user => (
            <Card key={user.id}>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='text-lg'>
                      {user.full_name || 'No name'}
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
                  <div className='flex gap-2'>
                    {getStatusBadge(user.status)}
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <Calendar className='h-4 w-4' />
                    <span>Created: {formatDate(user.created_at)}</span>
                    <span>•</span>
                    <span>Updated: {formatDate(user.updated_at)}</span>
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
                      value={user.role}
                      onValueChange={value =>
                        handleUserAction('update_role', user.id, value)
                      }
                      disabled={actionLoading === user.id}
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
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
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className='text-center py-8'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No users found
              </h3>
              <p className='text-gray-600'>
                No users have been registered yet.
              </p>
            </CardContent>
          </Card>
        )}

        <div className='mt-6 flex justify-between'>
          <Button
            variant='outline'
            onClick={() => router.push('/en/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? (
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
    </div>
  );
}
