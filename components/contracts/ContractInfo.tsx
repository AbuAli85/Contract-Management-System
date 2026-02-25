// components/contracts/ContractInfo.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  User,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Download,
  Edit,
} from 'lucide-react';

interface ContractInfoProps {
  contract: any;
  contractId: string;
}

// Activity data is derived from the contract prop
function getActivityData(contract: any) {
  return {
    addedBy: {
      id: contract?.created_by ?? '',
      name: contract?.created_by_name ?? contract?.created_by ?? 'Unknown',
      email: contract?.created_by_email ?? '',
      avatar: '',
      role: 'Contract Creator',
    },
    lastUpdatedBy: {
      id: contract?.updated_by ?? '',
      name: contract?.updated_by_name ?? contract?.updated_by ?? 'Unknown',
      email: contract?.updated_by_email ?? '',
      avatar: '',
      role: 'Last Editor',
    },
    tasks: [],
    notifications: [],
  };
}

export function ContractInfo({ contract, contractId }: ContractInfoProps) {
  const activityData = getActivityData(contract);
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className='h-4 w-4' />;
      case 'update':
        return <Bell className='h-4 w-4' />;
      case 'alert':
        return <AlertCircle className='h-4 w-4' />;
      default:
        return <Bell className='h-4 w-4' />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-6'>
      {/* Main Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Contract ID
              </label>
              <p className='mt-1 font-semibold'>{contract?.id}</p>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-500'>
                Status
              </label>
              <p className='mt-1 font-semibold capitalize'>
                {contract?.status}
              </p>
            </div>
          </div>

          <div className='mt-6 flex gap-2'>
            <Button asChild>
              <Link href={`/edit-contract/${contractId}`}>
                <Edit className='mr-2 h-4 w-4' />
                Edit Contract
              </Link>
            </Button>

            <Button variant='outline'>
              <Download className='mr-2 h-4 w-4' />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Activity & Updates */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Added By */}
            <div className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg'>
              <Avatar className='h-10 w-10'>
                <AvatarImage
                  src={activityData.addedBy.avatar}
                  alt={activityData.addedBy.name}
                />
                <AvatarFallback>
                  {activityData.addedBy.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold text-sm'>
                    {activityData.addedBy.name}
                  </p>
                  <Badge variant='secondary' className='text-xs'>
                    {activityData.addedBy.role}
                  </Badge>
                </div>
                <p className='text-sm text-gray-600'>
                  {activityData.addedBy.email}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  <span className='font-medium'>Contract Creator</span> •{' '}
                  {formatDate(contract?.created_at || new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Last Updated By */}
            <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
              <Avatar className='h-10 w-10'>
                <AvatarImage
                  src={activityData.lastUpdatedBy.avatar}
                  alt={activityData.lastUpdatedBy.name}
                />
                <AvatarFallback>
                  {activityData.lastUpdatedBy.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold text-sm'>
                    {activityData.lastUpdatedBy.name}
                  </p>
                  <Badge variant='secondary' className='text-xs'>
                    {activityData.lastUpdatedBy.role}
                  </Badge>
                </div>
                <p className='text-sm text-gray-600'>
                  {activityData.lastUpdatedBy.email}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  <span className='font-medium'>Last Update</span> •{' '}
                  {formatDate(contract?.updated_at || new Date().toISOString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5' />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {activityData.tasks.map(task => (
                <div
                  key={task.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-sm'>{task.title}</p>
                    <p className='text-xs text-gray-500'>{task.assignee}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    {task.status === 'completed' ? (
                      <Badge className='bg-green-100 text-green-800'>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant='outline'>
                        <Clock className='mr-1 h-3 w-3' />
                        Due {formatDate(task.dueDate)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {activityData.notifications.map(notification => (
              <div
                key={notification.id}
                className='flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors'
              >
                <div className='flex-shrink-0 mt-0.5'>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className='flex-1'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-medium text-sm'>
                        {notification.title}
                      </p>
                      <p className='text-sm text-gray-600 mt-1'>
                        {notification.description}
                      </p>
                      {notification.assignedTo && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Assigned to:{' '}
                          <span className='font-medium'>
                            {notification.assignedTo}
                          </span>
                        </p>
                      )}
                      {notification.user && (
                        <p className='text-xs text-gray-500 mt-1'>
                          By:{' '}
                          <span className='font-medium'>
                            {notification.user}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      {notification.priority && (
                        <Badge
                          className={getPriorityColor(notification.priority)}
                        >
                          {notification.priority}
                        </Badge>
                      )}
                      {notification.dueDate && (
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <Calendar className='h-3 w-3' />
                          {formatDate(notification.dueDate)}
                        </div>
                      )}
                      {notification.timestamp && (
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <Clock className='h-3 w-3' />
                          {formatDateTime(notification.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
