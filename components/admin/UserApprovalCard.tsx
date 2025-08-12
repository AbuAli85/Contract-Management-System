import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { getRoleDisplay } from '@/lib/role-hierarchy';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
}

interface UserApprovalCardProps {
  user: User;
  onApprove: (userId: string, status: string, role?: string) => Promise<void>;
  isLoading?: boolean;
}

export function UserApprovalCard({
  user,
  onApprove,
  isLoading = false,
}: UserApprovalCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'inactive':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      default:
        return <Clock className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <UserCheck className='h-5 w-5 text-gray-500' />
            <CardTitle className='text-lg'>
              {user.full_name || user.email}
            </CardTitle>
          </div>
          <div className='flex items-center space-x-2'>
            {getStatusIcon(user.status)}
            <Badge className={getStatusColor(user.status)}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Badge>
          </div>
        </div>
        <CardDescription>
          <div className='flex items-center justify-between'>
            <span>{user.email}</span>
            <Badge className={getRoleColor(user.role)}>
              {getRoleDisplay(user.role).displayText}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='text-sm text-gray-500'>
            <strong>Account Created:</strong>{' '}
            {new Date(user.created_at).toLocaleDateString()}
          </div>

          {user.status === 'pending' && (
            <div className='flex space-x-2'>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'active', 'user')}
                disabled={isLoading}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='h-4 w-4 mr-1' />
                Approve as User
              </Button>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'active', 'manager')}
                disabled={isLoading}
                variant='outline'
                className='border-blue-600 text-blue-600 hover:bg-blue-50'
              >
                <CheckCircle className='h-4 w-4 mr-1' />
                Approve as Manager
              </Button>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'inactive')}
                disabled={isLoading}
                variant='destructive'
              >
                <XCircle className='h-4 w-4 mr-1' />
                Reject
              </Button>
            </div>
          )}

          {user.status === 'active' && (
            <div className='flex space-x-2'>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'inactive')}
                disabled={isLoading}
                variant='outline'
                className='border-red-600 text-red-600 hover:bg-red-50'
              >
                <XCircle className='h-4 w-4 mr-1' />
                Deactivate
              </Button>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'pending')}
                disabled={isLoading}
                variant='outline'
              >
                <Clock className='h-4 w-4 mr-1' />
                Set Pending
              </Button>
            </div>
          )}

          {user.status === 'inactive' && (
            <div className='flex space-x-2'>
              <Button
                size='sm'
                onClick={() => onApprove(user.id, 'active')}
                disabled={isLoading}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='h-4 w-4 mr-1' />
                Reactivate
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
