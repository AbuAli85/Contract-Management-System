'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Loader2,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  created_at: string;
}

export function PendingApprovalsList() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/users/approval', {
        credentials: 'include', // Include cookies for authentication
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setPendingUsers(data.pendingUsers);
      } else {
        console.error('❌ Failed to fetch pending users:', data.error);
        toast({
          title: 'Error',
          description: 'Failed to fetch pending users',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('❌ Error fetching pending users:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Handle user approval/rejection
  const handleUserAction = async (
    userId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      setApproving(userId);

      const response = await fetch('/api/users/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          role: 'user', // Default role
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: `User ${action}d successfully`,
          description:
            action === 'approve'
              ? 'User has been approved and can now access the system.'
              : 'User has been rejected and cannot access the system.',
        });
        fetchPendingUsers(); // Refresh the list
      } else {
        toast({
          title: `Failed to ${action} user`,
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: `Error ${action}ing user`,
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <Clock className='mr-1 h-3 w-3' />
            Pending
          </Badge>
        );
      case 'active':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='mr-1 h-3 w-3' />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant='destructive'>
            <XCircle className='mr-1 h-3 w-3' />
            Inactive
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        <span className='ml-2 text-gray-600'>Loading pending users...</span>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className='py-12 text-center'>
        <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
        <h3 className='mb-2 text-lg font-semibold text-gray-900'>
          No Pending Approvals
        </h3>
        <p className='text-gray-600'>
          All user registrations have been processed.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {pendingUsers.map(user => (
        <Card key={user.id} className='transition-colors hover:bg-gray-50'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='flex-shrink-0'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                    <User className='h-5 w-5 text-blue-600' />
                  </div>
                </div>

                <div className='flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <h3 className='font-semibold text-gray-900'>
                      {user.full_name || 'No Name Provided'}
                    </h3>
                    {getStatusBadge(user.status)}
                  </div>

                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <Mail className='h-4 w-4' />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className='flex items-center gap-1'>
                        <Phone className='h-4 w-4' />
                        {user.phone}
                      </div>
                    )}
                    {user.department && (
                      <div className='flex items-center gap-1'>
                        <Building className='h-4 w-4' />
                        {user.department}
                      </div>
                    )}
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-4 w-4' />
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleUserAction(user.id, 'reject')}
                  disabled={approving === user.id}
                >
                  {approving === user.id ? (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  ) : (
                    <XCircle className='mr-1 h-4 w-4' />
                  )}
                  Reject
                </Button>
                <Button
                  size='sm'
                  onClick={() => handleUserAction(user.id, 'approve')}
                  disabled={approving === user.id}
                >
                  {approving === user.id ? (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  ) : (
                    <CheckCircle className='mr-1 h-4 w-4' />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
