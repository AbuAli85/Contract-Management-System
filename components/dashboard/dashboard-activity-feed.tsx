'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Activity,
  FileText,
  Users,
  Shield,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'contract' | 'promoter' | 'document' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'warning' | 'error' | 'info';
  user?: string;
  metadata?: Record<string, any>;
}

interface DashboardActivityFeedProps {
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function DashboardActivityFeed({
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 60000,
}: DashboardActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      // Show empty state on error
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getActivityIcon = (type: string, status: string) => {
    const iconProps = { className: 'h-4 w-4' };

    switch (type) {
      case 'contract':
        return <FileText {...iconProps} />;
      case 'promoter':
        return <Users {...iconProps} />;
      case 'document':
        return <Shield {...iconProps} />;
      case 'user':
        return <User {...iconProps} />;
      case 'system':
        return <Activity {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-3 w-3 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-3 w-3 text-yellow-600' />;
      case 'error':
        return <AlertTriangle className='h-3 w-3 text-red-600' />;
      case 'pending':
        return <Clock className='h-3 w-3 text-blue-600' />;
      default:
        return <Info className='h-3 w-3 text-gray-600' />;
    }
  };

  return (
    <Card className='border-0 shadow-lg'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-blue-600' />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and changes • Updated{' '}
              {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </CardDescription>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={fetchActivities}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-96'>
          <div className='space-y-3'>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-pulse'
                >
                  <div className='w-10 h-10 bg-gray-200 rounded-lg' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-3/4' />
                    <div className='h-3 bg-gray-200 rounded w-1/2' />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className='text-center py-12 text-gray-500'>
                <Clock className='h-16 w-16 mx-auto mb-3 opacity-30' />
                <p className='text-sm font-medium'>No recent activity</p>
                <p className='text-xs text-gray-400 mt-1'>
                  Activity will appear here as you use the system
                </p>
              </div>
            ) : (
              activities.slice(0, maxItems).map((activity, index) => (
                <div
                  key={activity.id}
                  className='group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200'
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeIn 0.3s ease-out forwards',
                  }}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg border transition-colors',
                      getActivityColor(activity.status)
                    )}
                  >
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900 truncate pr-2'>
                          {activity.title}
                        </p>
                        <p className='text-xs text-gray-600 truncate mt-0.5'>
                          {activity.description}
                        </p>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className='flex items-center gap-2 mt-2'>
                      <Clock className='h-3 w-3 text-gray-400' />
                      <span className='text-xs text-gray-500'>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      {activity.user && (
                        <>
                          <span className='text-gray-300'>•</span>
                          <User className='h-3 w-3 text-gray-400' />
                          <span className='text-xs text-gray-500'>
                            {activity.user}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {activities.length > maxItems && (
          <div className='mt-4 pt-4 border-t'>
            <Button variant='outline' className='w-full' size='sm'>
              <Eye className='h-4 w-4 mr-2' />
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock activities generator
function getMockActivities(): ActivityItem[] {
  return [
    {
      id: '1',
      type: 'contract',
      title: 'New Contract Created',
      description: 'Employment contract generated for Ahmed Al-Rashid',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
      status: 'success',
      user: 'Admin User',
    },
    {
      id: '2',
      type: 'promoter',
      title: 'Promoter Profile Updated',
      description: 'Document renewed for Sarah Mohammed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
      status: 'success',
      user: 'HR Manager',
    },
    {
      id: '3',
      type: 'document',
      title: 'Document Expiring Soon',
      description: 'Passport expiring in 15 days for Khalid Ahmed',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      status: 'warning',
    },
    {
      id: '4',
      type: 'contract',
      title: 'Contract Approved',
      description: 'Service contract with Al-Nahda Company approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
      status: 'success',
      user: 'Manager',
    },
    {
      id: '5',
      type: 'system',
      title: 'System Backup Completed',
      description: 'Automated daily backup completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
      status: 'info',
    },
  ];
}
