'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  FileText,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRoleContext } from './promoters-role-context';
import type { DashboardPromoter } from './types';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/utils/text-formatting';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PromotersEmployeeViewProps {
  promoter: DashboardPromoter | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onDownloadDocuments?: () => void;
}

export function PromotersEmployeeView({
  promoter,
  isLoading = false,
  onEdit,
  onDownloadDocuments,
}: PromotersEmployeeViewProps) {
  const roleContext = useRoleContext();

  if (isLoading) {
    return (
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardContent className='p-8'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 bg-slate-200 rounded w-1/3' />
            <div className='h-4 bg-slate-200 rounded w-2/3' />
            <div className='h-4 bg-slate-200 rounded w-1/2' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!promoter) {
    return (
      <Card className='shadow-xl border-2 border-amber-200 bg-amber-50/50'>
        <CardContent className='p-8 text-center'>
          <AlertTriangle className='h-12 w-12 text-amber-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-amber-900 mb-2'>
            Profile Not Found
          </h3>
          <p className='text-sm text-amber-700'>
            Your promoter profile could not be found. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const documentStatus = {
    id: promoter.idDocument.status,
    passport: promoter.passportDocument.status,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'expiring':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'missing':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className='h-4 w-4' />;
      case 'expiring':
        return <Clock className='h-4 w-4' />;
      case 'expired':
        return <AlertTriangle className='h-4 w-4' />;
      case 'missing':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <AlertTriangle className='h-4 w-4' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <Card className='shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white via-slate-50/50 to-white'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-3 rounded-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-indigo-500/30 border-2 border-primary/40 shadow-xl'>
                <User className='h-8 w-8 text-white' />
              </div>
              <div>
                <CardTitle className='text-2xl font-bold text-slate-900'>
                  {promoter.displayName}
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-1'>
                  {promoter.job_title ? toTitleCase(promoter.job_title) : 'Employee'}
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              {onEdit && roleContext.canEdit && (
                <Button variant='outline' size='sm' onClick={onEdit}>
                  <Edit className='h-4 w-4 mr-2' />
                  Edit Profile
                </Button>
              )}
              {onDownloadDocuments && (
                <Button variant='outline' size='sm' onClick={onDownloadDocuments}>
                  <Download className='h-4 w-4 mr-2' />
                  Documents
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-6 space-y-6'>
          {/* Contact Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                Contact Information
              </h3>
              <div className='space-y-2'>
                {promoter.contactEmail && (
                  <div className='flex items-center gap-2'>
                    <Mail className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>{promoter.contactEmail}</span>
                  </div>
                )}
                {promoter.contactPhone && (
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>{promoter.contactPhone}</span>
                  </div>
                )}
                {promoter.nationality && (
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>{promoter.nationality}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Information */}
            <div className='space-y-3'>
              <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                Assignment
              </h3>
              <div className='space-y-2'>
                {promoter.organisationLabel && (
                  <div className='flex items-center gap-2'>
                    <Building2 className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>{promoter.organisationLabel}</span>
                  </div>
                )}
                {promoter.created_at && (
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>
                      Joined {format(new Date(promoter.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <Badge
                  variant='outline'
                  className={cn(
                    'w-fit',
                    promoter.overallStatus === 'active'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : promoter.overallStatus === 'critical'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                  )}
                >
                  {promoter.overallStatus === 'active' ? 'Active' : promoter.overallStatus === 'critical' ? 'Critical' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Document Status */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
              Document Status
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* ID Card Status */}
              <Card className='border-2'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-5 w-5 text-muted-foreground' />
                      <span className='font-medium'>ID Card</span>
                    </div>
                    <Badge
                      variant='outline'
                      className={cn('flex items-center gap-1', getStatusColor(documentStatus.id))}
                    >
                      {getStatusIcon(documentStatus.id)}
                      {documentStatus.id === 'valid'
                        ? 'Valid'
                        : documentStatus.id === 'expiring'
                        ? 'Expiring'
                        : documentStatus.id === 'expired'
                        ? 'Expired'
                        : 'Missing'}
                    </Badge>
                  </div>
                  {promoter.idDocument.daysRemaining !== null && (
                    <p className='text-xs text-muted-foreground'>
                      {promoter.idDocument.daysRemaining > 0
                        ? `${promoter.idDocument.daysRemaining} days remaining`
                        : `Expired ${Math.abs(promoter.idDocument.daysRemaining)} days ago`}
                    </p>
                  )}
                  {promoter.idDocument.expiresOn && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      Expires: {format(new Date(promoter.idDocument.expiresOn), 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Passport Status */}
              <Card className='border-2'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <Shield className='h-5 w-5 text-muted-foreground' />
                      <span className='font-medium'>Passport</span>
                    </div>
                    <Badge
                      variant='outline'
                      className={cn('flex items-center gap-1', getStatusColor(documentStatus.passport))}
                    >
                      {getStatusIcon(documentStatus.passport)}
                      {documentStatus.passport === 'valid'
                        ? 'Valid'
                        : documentStatus.passport === 'expiring'
                        ? 'Expiring'
                        : documentStatus.passport === 'expired'
                        ? 'Expired'
                        : 'Missing'}
                    </Badge>
                  </div>
                  {promoter.passportDocument.daysRemaining !== null && (
                    <p className='text-xs text-muted-foreground'>
                      {promoter.passportDocument.daysRemaining > 0
                        ? `${promoter.passportDocument.daysRemaining} days remaining`
                        : `Expired ${Math.abs(promoter.passportDocument.daysRemaining)} days ago`}
                    </p>
                  )}
                  {promoter.passportDocument.expiresOn && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      Expires: {format(new Date(promoter.passportDocument.expiresOn), 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Required Alerts */}
          {(documentStatus.id !== 'valid' || documentStatus.passport !== 'valid') && (
            <Card className='border-2 border-amber-200 bg-amber-50/50'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <h4 className='font-semibold text-amber-900 mb-1'>Action Required</h4>
                    <ul className='text-sm text-amber-800 space-y-1'>
                      {documentStatus.id !== 'valid' && (
                        <li>
                          • Your ID Card {documentStatus.id === 'expired' ? 'has expired' : documentStatus.id === 'expiring' ? 'is expiring soon' : 'is missing'}. Please update it.
                        </li>
                      )}
                      {documentStatus.passport !== 'valid' && (
                        <li>
                          • Your Passport {documentStatus.passport === 'expired' ? 'has expired' : documentStatus.passport === 'expiring' ? 'is expiring soon' : 'is missing'}. Please update it.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

