'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { DashboardPromoter } from './types';

interface NotificationBadgeProps {
  promoters: DashboardPromoter[];
  className?: string;
  maxDisplayCount?: number; // Maximum count to display before showing "99+"
}

export function NotificationBadge({ 
  promoters, 
  className,
  maxDisplayCount = 99 
}: NotificationBadgeProps) {
  const notifications = useMemo(() => {
    // Optimize by stopping count once we reach maxDisplayCount + 1
    let critical = 0;
    let attention = 0;
    let expiring = 0;
    let total = 0;
    
    for (const p of promoters) {
      // Stop counting if we've exceeded display limit
      if (total > maxDisplayCount) break;
      
      if (p.overallStatus === 'critical') {
        critical++;
        total++;
      } else if (p.overallStatus === 'attention') {
        attention++;
        total++;
      } else if (
        p.idDocument.status === 'expiring' || 
        p.passportDocument.status === 'expiring'
      ) {
        expiring++;
        total++;
      }
    }
    
    return {
      critical,
      attention,
      expiring,
      total,
      displayTotal: total > maxDisplayCount ? `${maxDisplayCount}+` : total.toString()
    };
  }, [promoters, maxDisplayCount]);

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
          className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] flex items-center justify-center px-1 text-[10px] font-bold"
          title={`${notifications.total} total alerts`}
        >
          {notifications.displayTotal}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {notifications.critical > 0 && (
          <div 
            className="flex items-center gap-0.5"
            title={`${notifications.critical} critical alerts`}
          >
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>{notifications.critical > maxDisplayCount ? `${maxDisplayCount}+` : notifications.critical}</span>
          </div>
        )}
        {notifications.attention > 0 && (
          <div 
            className="flex items-center gap-0.5"
            title={`${notifications.attention} need attention`}
          >
            <Clock className="h-3 w-3 text-amber-500" />
            <span>{notifications.attention > maxDisplayCount ? `${maxDisplayCount}+` : notifications.attention}</span>
          </div>
        )}
        {notifications.expiring > 0 && (
          <div 
            className="flex items-center gap-0.5"
            title={`${notifications.expiring} documents expiring soon`}
          >
            <CheckCircle className="h-3 w-3 text-blue-500" />
            <span>{notifications.expiring > maxDisplayCount ? `${maxDisplayCount}+` : notifications.expiring}</span>
          </div>
        )}
      </div>
    </div>
  );
}
