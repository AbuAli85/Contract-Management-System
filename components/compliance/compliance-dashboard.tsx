'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Send,
  TrendingUp,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { ComplianceReport, DocumentAlert } from '@/lib/document-monitor-types';
import { formatDocumentType, getSeverityColor } from '@/lib/document-monitor-types';
import { format } from 'date-fns';

interface ComplianceDashboardProps {
  locale?: string;
}

export function ComplianceDashboard({ locale = 'en' }: ComplianceDashboardProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/documents');
      const data = await response.json();

      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlerts = async () => {
    try {
      setSendingAlerts(true);
      const response = await fetch('/api/compliance/documents/send-alerts', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert(`Alerts sent successfully! ${data.alertResults.emailsSent} emails, ${data.alertResults.notificationsCreated} notifications`);
      }
    } catch (error) {
      console.error('Error sending alerts:', error);
      alert('Failed to send alerts');
    } finally {
      setSendingAlerts(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!report) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        No compliance data available
      </div>
    );
  }

  const complianceColor =
    report.summary.complianceRate >= 90
      ? 'text-green-600'
      : report.summary.complianceRate >= 70
      ? 'text-yellow-600'
      : 'text-red-600';

  const complianceStatus =
    report.summary.complianceRate >= 90
      ? 'Excellent'
      : report.summary.complianceRate >= 70
      ? 'Good'
      : 'Needs Attention';

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Document Compliance
          </h2>
          <p className='text-muted-foreground'>
            Monitor and manage promoter document expirations
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={fetchComplianceData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            onClick={handleSendAlerts}
            disabled={sendingAlerts}
          >
            {sendingAlerts ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Send className='mr-2 h-4 w-4' />
                Send Alerts
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compliance Score */}
      <Card className='border-2'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Compliance Rate</CardTitle>
              <CardDescription>
                Overall document compliance status
              </CardDescription>
            </div>
            <Badge
              variant={
                report.summary.complianceRate >= 90
                  ? 'default'
                  : report.summary.complianceRate >= 70
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {complianceStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-2'>
            <span className={`text-6xl font-bold ${complianceColor}`}>
              {report.summary.complianceRate}%
            </span>
            <div className='text-sm text-muted-foreground'>
              <div>{report.summary.compliant} of {report.summary.total} promoters compliant</div>
              <div className='flex items-center gap-1 text-xs'>
                <TrendingUp className='h-3 w-3' />
                Target: 95%
              </div>
            </div>
          </div>

          <div className='mt-4 grid grid-cols-3 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Compliant</p>
              <p className='text-2xl font-bold text-green-600'>
                {report.summary.compliant}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Expiring (30d)</p>
              <p className='text-2xl font-bold text-yellow-600'>
                {report.summary.expiring30days}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Expired</p>
              <p className='text-2xl font-bold text-red-600'>
                {report.summary.expired}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Summary */}
      <div className='grid gap-4 md:grid-cols-3'>
        <AlertCard
          severity='critical'
          count={report.alerts.critical.length}
          title='Expired Documents'
          subtitle='Immediate action required'
          icon={XCircle}
        />
        <AlertCard
          severity='urgent'
          count={report.alerts.urgent.length}
          title='Expiring This Week'
          subtitle='Within 7 days'
          icon={AlertTriangle}
        />
        <AlertCard
          severity='warning'
          count={report.alerts.warning.length}
          title='Expiring This Month'
          subtitle='Within 30 days'
          icon={Clock}
        />
      </div>

      {/* Document Type Breakdown */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>ID Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Valid</span>
                <span className='font-semibold text-green-600'>
                  {report.byDocumentType.idCards.valid}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Expiring</span>
                <span className='font-semibold text-yellow-600'>
                  {report.byDocumentType.idCards.expiring}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Expired</span>
                <span className='font-semibold text-red-600'>
                  {report.byDocumentType.idCards.expired}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Passports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Valid</span>
                <span className='font-semibold text-green-600'>
                  {report.byDocumentType.passports.valid}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Expiring</span>
                <span className='font-semibold text-yellow-600'>
                  {report.byDocumentType.passports.expiring}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Expired</span>
                <span className='font-semibold text-red-600'>
                  {report.byDocumentType.passports.expired}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Alerts Table */}
      {(report.alerts.critical.length > 0 || report.alerts.urgent.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts Requiring Action</CardTitle>
            <CardDescription>
              {report.alerts.critical.length + report.alerts.urgent.length} promoters need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {/* Critical Alerts */}
              {report.alerts.critical.map((alert, idx) => (
                <DocumentAlertRow key={`critical-${idx}`} alert={alert} />
              ))}

              {/* Urgent Alerts */}
              {report.alerts.urgent.map((alert, idx) => (
                <DocumentAlertRow key={`urgent-${idx}`} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AlertCardProps {
  severity: 'critical' | 'urgent' | 'warning';
  count: number;
  title: string;
  subtitle: string;
  icon: any;
}

function AlertCard({ severity, count, title, subtitle, icon: Icon }: AlertCardProps) {
  const colors = {
    critical: 'border-red-200 bg-red-50',
    urgent: 'border-orange-200 bg-orange-50',
    warning: 'border-yellow-200 bg-yellow-50',
  };

  const textColors = {
    critical: 'text-red-600',
    urgent: 'text-orange-600',
    warning: 'text-yellow-600',
  };

  return (
    <Card className={`border-2 ${colors[severity]}`}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${textColors[severity]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textColors[severity]}`}>{count}</div>
        <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DocumentAlertRow({ alert }: { alert: DocumentAlert }) {
  const colorClass = getSeverityColor(alert.severity);

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 ${colorClass}`}
    >
      <div className='flex items-center gap-4'>
        <div>
          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
            {alert.severity.toUpperCase()}
          </Badge>
        </div>
        <div>
          <p className='font-semibold'>{alert.promoterName}</p>
          <p className='text-sm text-muted-foreground'>
            {formatDocumentType(alert.documentType)} •{' '}
            {alert.status === 'expired'
              ? 'Expired'
              : `Expires in ${alert.daysUntilExpiry} days`}{' '}
            • {format(new Date(alert.expiryDate), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
      <Button variant='outline' size='sm' asChild>
        <a href={`/en/promoters`}>View</a>
      </Button>
    </div>
  );
}

