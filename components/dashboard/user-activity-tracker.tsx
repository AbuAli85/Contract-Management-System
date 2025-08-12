'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  User,
  FileText,
  Settings,
  Users,
} from 'lucide-react';

export function UserActivityTracker() {
  const { activities, summary, loading, error, fetchUserActivities } =
    useUserActivity();
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserActivities();
    setRefreshing(false);
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className='h-4 w-4' />;
      case 'create':
      case 'update':
      case 'delete':
        return <FileText className='h-4 w-4' />;
      case 'settings':
        return <Settings className='h-4 w-4' />;
      case 'user_management':
        return <Users className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'login':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'logout':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-gray-500'>
            <p>Failed to load activity data</p>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              className='mt-2'
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              User Activity
            </CardTitle>
            <CardDescription>
              Recent activities for {profile?.display_name || 'User'}
            </CardDescription>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Activity Summary */}
        {summary && (
          <div className='grid grid-cols-2 gap-4 mb-6'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {summary.today_activities}
              </div>
              <div className='text-sm text-blue-600'>Today</div>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {summary.this_week_activities}
              </div>
              <div className='text-sm text-green-600'>This Week</div>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className='space-y-3'>
          {activities.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              <Activity className='h-12 w-12 mx-auto mb-4 text-gray-300' />
              <p>No recent activities</p>
            </div>
          ) : (
            activities.slice(0, 5).map(activity => (
              <div
                key={activity.id}
                className='flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50'
              >
                <div className='flex-shrink-0'>
                  {getActionIcon(activity.action)}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='font-medium text-sm'>
                      {activity.action}
                    </span>
                    <Badge
                      variant='outline'
                      className={`text-xs ${getActionColor(activity.action)}`}
                    >
                      {activity.resource_type}
                    </Badge>
                  </div>
                  <p className='text-sm text-gray-600 mb-1'>
                    {activity.resource_name || activity.resource_type}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                    <Clock className='h-3 w-3' />
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Link */}
        {activities.length > 5 && (
          <div className='mt-4 pt-4 border-t'>
            <Button variant='ghost' size='sm' className='w-full'>
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
