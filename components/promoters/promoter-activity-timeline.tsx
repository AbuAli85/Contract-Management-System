'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Edit,
  Plus,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'contract' | 'document' | 'status' | 'profile' | 'task' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface PromoterActivityTimelineProps {
  activities: ActivityItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function PromoterActivityTimeline({ 
  activities, 
  onLoadMore, 
  hasMore, 
  isLoading 
}: PromoterActivityTimelineProps) {
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'contract':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <Download className="h-4 w-4" />;
      case 'status':
        return <CheckCircle className="h-4 w-4" />;
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      contract: { label: 'Contract', variant: 'default' as const },
      document: { label: 'Document', variant: 'secondary' as const },
      status: { label: 'Status', variant: 'outline' as const },
      profile: { label: 'Profile', variant: 'outline' as const },
      task: { label: 'Task', variant: 'secondary' as const },
      system: { label: 'System', variant: 'outline' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.system;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatActivityDescription = (activity: ActivityItem) => {
    let description = activity.description;
    
    // Add metadata context if available
    if (activity.metadata) {
      if (activity.metadata.contractTitle) {
        description += ` - "${activity.metadata.contractTitle}"`;
      }
      if (activity.metadata.documentType) {
        description += ` (${activity.metadata.documentType})`;
      }
      if (activity.metadata.oldValue && activity.metadata.newValue) {
        description += `: ${activity.metadata.oldValue} → ${activity.metadata.newValue}`;
      }
    }
    
    return description;
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
            <p className="text-gray-500">
              This promoter's activity timeline will appear here as they interact with the system.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                )}
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{activity.action}</h4>
                    {getTypeBadge(activity.type)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {formatActivityDescription(activity)}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {activity.user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{activity.user}</span>
                    </div>
                  )}
                </div>
                
                {/* Additional metadata */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 text-gray-600 overflow-x-auto">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Load More Button */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Load More Activities
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
