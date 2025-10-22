'use client';

import { useEffect, useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { Activity, FileText, Users, Building } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { WidgetProps } from '@/lib/types/dashboard';

interface ActivityItem {
  id: string;
  type: 'contract' | 'promoter' | 'party';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export function RecentActivityWidget(props: WidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const limit = props.config.filters?.limit || 10;
      const response = await fetch(`/api/dashboard/activity?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities || []);
      } else {
        setError(data.error || 'Failed to load activities');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    const interval = props.config.refreshInterval || 30;
    const timer = setInterval(fetchActivities, interval * 1000);
    
    return () => clearInterval(timer);
  }, [props.config.refreshInterval, props.config.filters?.limit]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileText className="h-4 w-4" />;
      case 'promoter':
        return <Users className="h-4 w-4" />;
      case 'party':
        return <Building className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'updated':
        return 'text-blue-600 dark:text-blue-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <BaseWidget
      {...props}
      title="Recent Activity"
      description="Latest changes and updates"
      icon={<Activity className="h-4 w-4" />}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchActivities}
    >
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Activity className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {activity.link ? (
                      <Link
                        href={activity.link}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {activity.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                    )}
                    <span className={`text-xs font-medium ${getActionColor(activity.action)}`}>
                      {activity.action}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

