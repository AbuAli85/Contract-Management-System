'use client';

import { useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  FileText,
  Clock,
  User,
  Zap,
} from 'lucide-react';
import type { DashboardPromoter } from './types';
import { cn } from '@/lib/utils';

interface CriticalAlertsBannerProps {
  promoters: DashboardPromoter[];
  onSendBulkReminders?: (promoterIds: string[]) => void;
  onRequestBulkDocuments?: (promoterIds: string[]) => void;
  onViewPromoter?: (promoter: DashboardPromoter) => void;
}

type AlertCategory = 'expired' | 'expiring_today' | 'expiring_soon' | 'missing';

interface CriticalAlert {
  category: AlertCategory;
  promoter: DashboardPromoter;
  documentType: 'id_card' | 'passport';
  message: string;
  daysRemaining: number | null;
  severity: 'critical' | 'high' | 'medium';
}

export function CriticalAlertsBanner({
  promoters,
  onSendBulkReminders,
  onRequestBulkDocuments,
  onViewPromoter,
}: CriticalAlertsBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const alerts = useMemo<CriticalAlert[]>(() => {
    const result: CriticalAlert[] = [];

    for (const promoter of promoters) {
      // Check ID Card
      if (promoter.idDocument.status === 'expired') {
        result.push({
          category: 'expired',
          promoter,
          documentType: 'id_card',
          message: `ID Card expired ${Math.abs(promoter.idDocument.daysRemaining || 0)} days ago`,
          daysRemaining: promoter.idDocument.daysRemaining,
          severity: 'critical',
        });
      } else if (promoter.idDocument.status === 'expiring') {
        const days = promoter.idDocument.daysRemaining || 0;
        if (days === 0) {
          result.push({
            category: 'expiring_today',
            promoter,
            documentType: 'id_card',
            message: 'ID Card expires TODAY',
            daysRemaining: 0,
            severity: 'critical',
          });
        } else if (days <= 3) {
          result.push({
            category: 'expiring_soon',
            promoter,
            documentType: 'id_card',
            message: `ID Card expires in ${days} day${days !== 1 ? 's' : ''}`,
            daysRemaining: days,
            severity: 'critical',
          });
        }
      } else if (promoter.idDocument.status === 'missing') {
        result.push({
          category: 'missing',
          promoter,
          documentType: 'id_card',
          message: 'ID Card not provided',
          daysRemaining: null,
          severity: 'high',
        });
      }

      // Check Passport
      if (promoter.passportDocument.status === 'expired') {
        result.push({
          category: 'expired',
          promoter,
          documentType: 'passport',
          message: `Passport expired ${Math.abs(promoter.passportDocument.daysRemaining || 0)} days ago`,
          daysRemaining: promoter.passportDocument.daysRemaining,
          severity: 'high',
        });
      } else if (promoter.passportDocument.status === 'expiring') {
        const days = promoter.passportDocument.daysRemaining || 0;
        if (days === 0) {
          result.push({
            category: 'expiring_today',
            promoter,
            documentType: 'passport',
            message: 'Passport expires TODAY',
            daysRemaining: 0,
            severity: 'critical',
          });
        } else if (days <= 3) {
          result.push({
            category: 'expiring_soon',
            promoter,
            documentType: 'passport',
            message: `Passport expires in ${days} day${days !== 1 ? 's' : ''}`,
            daysRemaining: days,
            severity: 'high',
          });
        }
      }
    }

    // Sort by severity and days remaining
    return result.sort((a, b) => {
      // Critical first
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1;
      }
      // Then by days remaining (null values last)
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [promoters]);

  const stats = useMemo(
    () => ({
      total: alerts.length,
      expired: alerts.filter(a => a.category === 'expired').length,
      expiringToday: alerts.filter(a => a.category === 'expiring_today').length,
      expiringSoon: alerts.filter(a => a.category === 'expiring_soon').length,
      missing: alerts.filter(a => a.category === 'missing').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
    }),
    [alerts]
  );

  if (stats.total === 0 || isDismissed) {
    return null;
  }

  const handleBulkReminders = () => {
    const promoterIds = alerts
      .filter(a => a.category !== 'missing')
      .map(a => a.promoter.id);
    onSendBulkReminders?.(Array.from(new Set(promoterIds)));
  };

  const handleBulkDocumentRequests = () => {
    const promoterIds = alerts
      .filter(a => a.category === 'missing')
      .map(a => a.promoter.id);
    onRequestBulkDocuments?.(Array.from(new Set(promoterIds)));
  };

  return (
    <Alert
      variant='destructive'
      className='relative bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-950/50 dark:via-orange-950/50 dark:to-amber-950/50 border-2 border-red-500/50 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500'
    >
      {/* Close Button */}
      <Button
        variant='ghost'
        size='icon'
        className='absolute right-2 top-2 h-6 w-6'
        onClick={() => setIsDismissed(true)}
      >
        <X className='h-4 w-4' />
      </Button>

      {/* Alert Icon */}
      <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400 animate-pulse' />

      {/* Alert Content */}
      <div className='ml-0 space-y-3'>
        <AlertTitle className='text-lg font-bold text-red-900 dark:text-red-100 flex items-center gap-2'>
          🚨 Critical Document Alerts
          <Badge variant='destructive' className='ml-2'>
            {stats.critical} Critical
          </Badge>
        </AlertTitle>

        <AlertDescription className='text-red-800 dark:text-red-200'>
          <div className='flex flex-wrap items-center gap-4 mb-3'>
            {stats.expired > 0 && (
              <div className='flex items-center gap-1'>
                <AlertTriangle className='h-4 w-4' />
                <span className='font-semibold'>{stats.expired}</span>
                <span>expired</span>
              </div>
            )}
            {stats.expiringToday > 0 && (
              <div className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                <span className='font-semibold'>{stats.expiringToday}</span>
                <span>expiring today</span>
              </div>
            )}
            {stats.expiringSoon > 0 && (
              <div className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                <span className='font-semibold'>{stats.expiringSoon}</span>
                <span>expiring within 3 days</span>
              </div>
            )}
            {stats.missing > 0 && (
              <div className='flex items-center gap-1'>
                <FileText className='h-4 w-4' />
                <span className='font-semibold'>{stats.missing}</span>
                <span>missing documents</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap gap-2 mb-3'>
            {stats.expired + stats.expiringToday + stats.expiringSoon > 0 &&
              onSendBulkReminders && (
                <Button
                  size='sm'
                  variant='default'
                  onClick={handleBulkReminders}
                  className='bg-red-600 hover:bg-red-700 text-white'
                >
                  <Zap className='mr-2 h-4 w-4' />
                  Send{' '}
                  {stats.expired +
                    stats.expiringToday +
                    stats.expiringSoon}{' '}
                  Urgent Reminders
                </Button>
              )}
            {stats.missing > 0 && onRequestBulkDocuments && (
              <Button
                size='sm'
                variant='outline'
                onClick={handleBulkDocumentRequests}
                className='border-red-300 hover:bg-red-100 dark:hover:bg-red-900/20'
              >
                <FileText className='mr-2 h-4 w-4' />
                Request {stats.missing} Missing Documents
              </Button>
            )}
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setIsExpanded(!isExpanded)}
              className='ml-auto'
            >
              {isExpanded ? (
                <>
                  <ChevronUp className='mr-1 h-4 w-4' />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className='mr-1 h-4 w-4' />
                  Show Details ({stats.total})
                </>
              )}
            </Button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className='mt-4 space-y-2 max-h-64 overflow-y-auto border-t border-red-300 dark:border-red-700 pt-3'>
              {alerts.slice(0, 20).map((alert, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md text-sm',
                    alert.severity === 'critical'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  )}
                >
                  <div className='flex items-center gap-2 min-w-0 flex-1'>
                    <User className='h-3 w-3 flex-shrink-0' />
                    <span className='font-medium truncate'>
                      {alert.promoter.displayName}
                    </span>
                    <span className='text-xs text-muted-foreground truncate'>
                      {alert.message}
                    </span>
                  </div>
                  {onViewPromoter && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onViewPromoter(alert.promoter)}
                      className='h-7 text-xs flex-shrink-0'
                    >
                      View
                    </Button>
                  )}
                </div>
              ))}
              {alerts.length > 20 && (
                <div className='text-center text-sm text-muted-foreground'>
                  ... and {alerts.length - 20} more critical alerts
                </div>
              )}
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}
