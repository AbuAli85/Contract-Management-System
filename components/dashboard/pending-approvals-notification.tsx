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
import { useToastHelpers } from '@/components/toast-notifications';
import { usePermissions } from '@/hooks/use-permissions';
import { Users, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PendingApprovalsData {
  count: number;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
  }>;
}

export function PendingApprovalsNotification() {
  const { canManageUsers } = usePermissions();
  const { error } = useToastHelpers();
  const [data, setData] = useState<PendingApprovalsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Only show for admins
  if (!canManageUsers()) {
    return null;
  }

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/approval', {
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json();

      if (result.success) {
        setData({
          count: result.pendingUsers.length,
          recentUsers: result.pendingUsers.slice(0, 3), // Show only 3 most recent
        });
      } else {
        error('Failed to fetch pending approvals', result.error);
      }
    } catch (err) {
      error('Error fetching pending approvals', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Don't show if no pending approvals
  if (!loading && (!data || data.count === 0)) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  return (
    <Card className='border-yellow-200 bg-yellow-50'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-yellow-600' />
            <CardTitle className='text-lg text-yellow-900'>
              Pending User Approvals
            </CardTitle>
          </div>
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            {loading ? '...' : data?.count || 0} Pending
          </Badge>
        </div>
        <CardDescription className='text-yellow-700'>
          New users are waiting for approval to access the system
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {loading ? (
          <div className='flex items-center justify-center py-4'>
            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-yellow-600'></div>
            <span className='ml-2 text-yellow-700'>Loading...</span>
          </div>
        ) : data && data.count > 0 ? (
          <>
            {/* Recent pending users */}
            <div className='space-y-2'>
              {data.recentUsers.map(user => (
                <div
                  key={user.id}
                  className='flex items-center justify-between rounded border border-yellow-200 bg-white p-2'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100'>
                      <Users className='h-4 w-4 text-yellow-600' />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {user.full_name || 'No Name Provided'}
                      </p>
                      <p className='text-sm text-gray-600'>{user.email}</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-500'>
                      {formatDate(user.created_at)}
                    </p>
                    <Badge
                      variant='outline'
                      className='border-yellow-300 bg-yellow-50 text-xs text-yellow-700'
                    >
                      <Clock className='mr-1 h-3 w-3' />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}

              {data.count > 3 && (
                <div className='text-center text-sm text-yellow-700'>
                  +{data.count - 3} more pending users
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className='flex gap-2 pt-2'>
              <Button
                asChild
                className='flex-1 bg-yellow-600 text-white hover:bg-yellow-700'
              >
                <Link href='/dashboard/user-approvals'>
                  <Users className='mr-2 h-4 w-4' />
                  Review All
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>

              <Button
                variant='outline'
                onClick={fetchPendingApprovals}
                className='border-yellow-300 text-yellow-700 hover:bg-yellow-100'
              >
                Refresh
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
