'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Upload,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { PromoterFinancialSummary } from './promoter-financial-summary';
import { PromoterPredictiveScore } from './promoter-predictive-score';
import { PromoterQuickActions } from './promoter-quick-actions';

interface PromoterIntelligenceHubLayoutProps {
  children: React.ReactNode;
  promoterData: any;
  performanceMetrics?: any;
  isAdmin: boolean;
  onEdit: () => void;
  onCall: () => void;
  onEmail: () => void;
  onMessage: () => void;
  onViewProfile: () => void;
  onViewContracts: () => void;
  onCreateContract: () => void;
  onUploadDocuments: () => void;
  onDownloadProfile: () => void;
  onScheduleMeeting: () => void;
  onAddToFavorites: () => void;
  onShare: () => void;
  onDelete: () => void;
  hasDocuments?: boolean;
  hasContracts?: boolean;
}

export function PromoterIntelligenceHubLayout({
  children,
  promoterData,
  performanceMetrics,
  isAdmin,
  onEdit,
  onCall,
  onEmail,
  onMessage,
  onViewProfile,
  onViewContracts,
  onCreateContract,
  onUploadDocuments,
  onDownloadProfile,
  onScheduleMeeting,
  onAddToFavorites,
  onShare,
  onDelete,
  hasDocuments = false,
  hasContracts = false,
}: PromoterIntelligenceHubLayoutProps) {
  // Document Health Summary
  const getDocumentHealth = () => {
    const urgentAlerts = [];

    // Check ID Card
    if (promoterData.id_card_expiry_date) {
      const daysUntilExpiry = differenceInDays(
        new Date(promoterData.id_card_expiry_date),
        new Date()
      );
      if (daysUntilExpiry < 0) {
        urgentAlerts.push({
          id: 'id-expired',
          message: 'ID Card Expired',
          severity: 'critical',
          action: 'Upload new ID card',
          icon: <XCircle className='h-4 w-4' />,
        });
      } else if (daysUntilExpiry <= 30) {
        urgentAlerts.push({
          id: 'id-expiring',
          message: `ID Card expires in ${daysUntilExpiry} days`,
          severity: 'warning',
          action: 'Request renewal',
          icon: <AlertTriangle className='h-4 w-4' />,
        });
      }
    } else if (!promoterData.id_card_number) {
      urgentAlerts.push({
        id: 'id-missing',
        message: 'ID Card Missing',
        severity: 'critical',
        action: 'Upload ID card',
        icon: <XCircle className='h-4 w-4' />,
      });
    }

    // Check Passport
    if (promoterData.passport_expiry_date) {
      const daysUntilExpiry = differenceInDays(
        new Date(promoterData.passport_expiry_date),
        new Date()
      );
      if (daysUntilExpiry < 0) {
        urgentAlerts.push({
          id: 'passport-expired',
          message: 'Passport Expired',
          severity: 'high',
          action: 'Upload new passport',
          icon: <XCircle className='h-4 w-4' />,
        });
      } else if (daysUntilExpiry <= 60) {
        urgentAlerts.push({
          id: 'passport-expiring',
          message: `Passport expires in ${daysUntilExpiry} days`,
          severity: 'warning',
          action: 'Request renewal',
          icon: <AlertTriangle className='h-4 w-4' />,
        });
      }
    }

    const totalDocs = 2; // ID and Passport
    const validDocs =
      urgentAlerts.length === 0
        ? 2
        : urgentAlerts.filter(a => a.severity !== 'critical').length;
    const compliancePercentage = Math.round((validDocs / totalDocs) * 100);

    return {
      status:
        urgentAlerts.length === 0
          ? 'compliant'
          : urgentAlerts.some(a => a.severity === 'critical')
            ? 'critical'
            : 'warning',
      compliancePercentage,
      urgentAlerts: urgentAlerts.slice(0, 3),
    };
  };

  const documentHealth = getDocumentHealth();

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
      case 'critical':
        return <XCircle className='h-5 w-5 text-red-600' />;
      default:
        return <Clock className='h-5 w-5 text-gray-600' />;
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
      {/* Left Column - Main Content (spans 8 columns on desktop) */}
      <div className='lg:col-span-8 space-y-6'>{children}</div>

      {/* Right Column - Fixed Sidebar (spans 4 columns on desktop) */}
      <div className='lg:col-span-4 space-y-6'>
        {/* Predictive Performance Score */}
        <PromoterPredictiveScore
          performanceMetrics={performanceMetrics}
          contracts={promoterData.contracts}
          documentsCompliant={documentHealth.status === 'compliant'}
          lastActive={promoterData.last_active}
        />

        {/* Financial Summary */}
        <PromoterFinancialSummary
          promoterId={promoterData.id}
          contracts={promoterData.contracts}
        />

        {/* Document Health Summary */}
        <Card
          className={`border-2 ${getHealthStatusColor(documentHealth.status)}`}
        >
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              {getHealthIcon(documentHealth.status)}
              Document Health
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Compliance Score */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Compliance Score</span>
                <span className='text-lg font-bold'>
                  {documentHealth.compliancePercentage}%
                </span>
              </div>
              <Progress
                value={documentHealth.compliancePercentage}
                className='h-2'
              />
            </div>

            {/* Urgent Alerts */}
            {documentHealth.urgentAlerts.length > 0 ? (
              <div className='space-y-2'>
                <h4 className='text-xs font-semibold text-gray-700'>
                  Urgent Alerts
                </h4>
                {documentHealth.urgentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className='flex items-start gap-2'>
                      <div
                        className={
                          alert.severity === 'critical'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }
                      >
                        {alert.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium text-gray-900'>
                          {alert.message}
                        </p>
                        <Button
                          size='sm'
                          variant='link'
                          className='text-xs p-0 h-auto mt-1'
                          onClick={onUploadDocuments}
                        >
                          {alert.action} →
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center gap-2 p-3 bg-green-50 rounded-lg'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span className='text-xs font-medium text-green-900'>
                  All documents compliant
                </span>
              </div>
            )}

            {/* Quick Actions */}
            {isAdmin && (
              <div className='flex gap-2 pt-2 border-t'>
                <Button
                  size='sm'
                  variant='outline'
                  className='flex-1'
                  onClick={onUploadDocuments}
                >
                  <Upload className='h-3 w-3 mr-1' />
                  Upload
                </Button>
                <Button size='sm' variant='outline' className='flex-1'>
                  <Eye className='h-3 w-3 mr-1' />
                  View All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Quick Actions */}
        <Card className='border-2 border-gray-100'>
          <CardHeader>
            <CardTitle className='text-base'>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {isAdmin && (
              <>
                <Button
                  variant='default'
                  className='w-full justify-start'
                  onClick={onEdit}
                >
                  Edit Profile
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={onCreateContract}
                >
                  Create Contract
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={onViewContracts}
                  disabled={!hasContracts}
                >
                  <ExternalLink className='h-4 w-4 mr-2' />
                  View Contracts
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={onScheduleMeeting}
                >
                  Schedule Meeting
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
