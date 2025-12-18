'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileX,
  Calendar,
  Shield,
  XCircle,
} from 'lucide-react';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ComplianceAlertsProps {
  idCardNumber?: string;
  idCardExpiryDate?: string;
  idCardUrl?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  passportUrl?: string;
  contracts?: any[];
  isAdmin?: boolean;
  locale?: string;
  promoterId?: string;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  daysUntilExpiry?: number;
}

export function EmployeeComplianceAlerts({
  idCardNumber,
  idCardExpiryDate,
  idCardUrl,
  passportNumber,
  passportExpiryDate,
  passportUrl,
  contracts = [],
  isAdmin = false,
  locale = 'en',
  promoterId,
}: ComplianceAlertsProps) {
  const router = useRouter();

  const alerts = useMemo(() => {
    const alertList: AlertItem[] = [];
    const now = new Date();

    // Check ID Card
    if (!idCardNumber || !idCardExpiryDate) {
      alertList.push({
        id: 'id-missing',
        type: 'error',
        title: 'ID Card Missing',
        description: 'Employee ID card information is not on file. This is required for compliance.',
        action: isAdmin
          ? {
              label: 'Upload ID Card',
              onClick: () => {
                // Scroll to document upload section or open dialog
                const uploadSection = document.getElementById('document-upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                }
              },
            }
          : undefined,
      });
    } else {
      try {
        const expiryDate = parseISO(idCardExpiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        if (isPast(expiryDate)) {
          alertList.push({
            id: 'id-expired',
            type: 'error',
            title: 'ID Card Expired',
            description: `ID card expired on ${format(expiryDate, 'MMM dd, yyyy')}. Immediate action required.`,
            daysUntilExpiry: daysUntilExpiry,
            action: isAdmin
              ? {
                  label: 'Update Document',
                  onClick: () => {
                    const uploadSection = document.getElementById('document-upload-section');
                    if (uploadSection) {
                      uploadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  },
                }
              : undefined,
          });
        } else if (daysUntilExpiry <= 30) {
          alertList.push({
            id: 'id-expiring',
            type: 'warning',
            title: 'ID Card Expiring Soon',
            description: `ID card expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} on ${format(expiryDate, 'MMM dd, yyyy')}.`,
            daysUntilExpiry,
            action: isAdmin
              ? {
                  label: 'Renew Document',
                  onClick: () => {
                    const uploadSection = document.getElementById('document-upload-section');
                    if (uploadSection) {
                      uploadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  },
                }
              : undefined,
          });
        }
      } catch (error) {
        console.error('Error parsing ID card expiry date:', error);
      }
    }

    // Check Passport
    if (!passportNumber || !passportExpiryDate) {
      alertList.push({
        id: 'passport-missing',
        type: 'error',
        title: 'Passport Missing',
        description: 'Employee passport information is not on file. This may be required for compliance.',
        action: isAdmin
          ? {
              label: 'Upload Passport',
              onClick: () => {
                const uploadSection = document.getElementById('document-upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                }
              },
            }
          : undefined,
      });
    } else {
      try {
        const expiryDate = parseISO(passportExpiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        if (isPast(expiryDate)) {
          alertList.push({
            id: 'passport-expired',
            type: 'error',
            title: 'Passport Expired',
            description: `Passport expired on ${format(expiryDate, 'MMM dd, yyyy')}. Immediate action required.`,
            daysUntilExpiry,
            action: isAdmin
              ? {
                  label: 'Update Document',
                  onClick: () => {
                    const uploadSection = document.getElementById('document-upload-section');
                    if (uploadSection) {
                      uploadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  },
                }
              : undefined,
          });
        } else if (daysUntilExpiry <= 60) {
          alertList.push({
            id: 'passport-expiring',
            type: 'warning',
            title: 'Passport Expiring Soon',
            description: `Passport expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} on ${format(expiryDate, 'MMM dd, yyyy')}.`,
            daysUntilExpiry,
            action: isAdmin
              ? {
                  label: 'Renew Document',
                  onClick: () => {
                    const uploadSection = document.getElementById('document-upload-section');
                    if (uploadSection) {
                      uploadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  },
                }
              : undefined,
          });
        }
      } catch (error) {
        console.error('Error parsing passport expiry date:', error);
      }
    }

    // Check for active contracts without valid documents
    const activeContracts = contracts.filter((c: any) => c.status === 'active');
    if (activeContracts.length > 0) {
      const hasValidId = idCardNumber && idCardExpiryDate && !isPast(parseISO(idCardExpiryDate));
      if (!hasValidId) {
        alertList.push({
          id: 'contract-compliance',
          type: 'warning',
          title: 'Active Contracts with Invalid Documents',
          description: `Employee has ${activeContracts.length} active contract${activeContracts.length !== 1 ? 's' : ''} but missing or expired ID card.`,
        });
      }
    }

    return alertList.sort((a, b) => {
      // Sort by severity: error > warning > info > success
      const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
      return severityOrder[a.type] - severityOrder[b.type];
    });
  }, [
    idCardNumber,
    idCardExpiryDate,
    passportNumber,
    passportExpiryDate,
    contracts,
    isAdmin,
  ]);

  const criticalAlerts = alerts.filter((a) => a.type === 'error');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');
  const isCompliant = alerts.length === 0 || alerts.every((a) => a.type === 'success' || a.type === 'info');

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Compliance Status
          </CardTitle>
          <CardDescription>All documents are compliant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              All compliance requirements are met
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Compliance Alerts
        </CardTitle>
        <CardDescription>
          {criticalAlerts.length > 0 && (
            <span className="text-red-600 font-medium">
              {criticalAlerts.length} critical issue{criticalAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
          {criticalAlerts.length === 0 && warningAlerts.length > 0 && (
            <span className="text-orange-600 font-medium">
              {warningAlerts.length} warning{warningAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className={
              alert.type === 'warning'
                ? 'border-orange-200 bg-orange-50'
                : alert.type === 'error'
                ? 'border-red-200 bg-red-50'
                : ''
            }
          >
            <div className="flex items-start gap-3">
              {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />}
              {alert.type === 'info' && <Clock className="h-5 w-5 text-blue-600 mt-0.5" />}
              {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              
              <div className="flex-1">
                <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  {alert.description}
                  {alert.daysUntilExpiry !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">
                        {alert.daysUntilExpiry < 0
                          ? `Expired ${Math.abs(alert.daysUntilExpiry)} day${Math.abs(alert.daysUntilExpiry) !== 1 ? 's' : ''} ago`
                          : `${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''} remaining`}
                      </span>
                    </div>
                  )}
                </AlertDescription>
                {alert.action && (
                  <Button
                    size="sm"
                    variant={alert.type === 'error' ? 'destructive' : 'outline'}
                    className="mt-2"
                    onClick={alert.action.onClick}
                  >
                    {alert.action.label}
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

