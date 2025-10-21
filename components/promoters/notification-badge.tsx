'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { DashboardPromoter } from './types';

interface NotificationBadgeProps {
  promoters: DashboardPromoter[];
  className?: string;
}

export function NotificationBadge({ promoters, className }: NotificationBadgeProps) {
  const notifications = useMemo(() => {
    const critical = promoters.filter(p => p.overallStatus === 'critical').length;
    const attention = promoters.filter(p => p.overallStatus === 'attention').length;
    const expiring = promoters.filter(p => 
      p.idDocument.status === 'expiring' || p.passportDocument.status === 'expiring'
    ).length;
    
    return {
      critical,
      attention,
      expiring,
      total: critical + attention + expiring
    };
  }, [promoters]);

  if (notifications.total === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No alerts</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Bell className="h-4 w-4 text-foreground" />
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {notifications.total}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {notifications.critical > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>{notifications.critical}</span>
          </div>
        )}
        {notifications.attention > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>{notifications.attention}</span>
          </div>
        )}
        {notifications.expiring > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-blue-500" />
            <span>{notifications.expiring}</span>
          </div>
        )}
      </div>
    </div>
  );
}
