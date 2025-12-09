'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Download,
  Upload,
  Eye,
  RefreshCw,
  Shield,
  AlertCircle,
  TrendingUp,
  Bell,
  FileCheck,
  FileClock,
} from 'lucide-react';
import { differenceInDays, format, addDays, isPast, isFuture } from 'date-fns';

interface Document {
  id: string;
  type:
    | 'id_card'
    | 'passport'
    | 'work_permit'
    | 'health_certificate'
    | 'criminal_record'
    | 'contract'
    | 'training_certificate'
    | 'insurance';
  name: string;
  number?: string | undefined;
  issueDate?: string | undefined;
  expiryDate?: string | undefined;
  uploadedDate?: string | undefined;
  url?: string | undefined;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing' | 'pending_review';
  isRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'identity' | 'legal' | 'medical' | 'professional';
  reminderDays: number[];
  lastReminderSent?: string | undefined;
}

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  documents: string[];
  isMandatory: boolean;
  deadline?: string;
  status: 'compliant' | 'non_compliant' | 'pending';
}

interface PromoterComplianceTrackerProps {
  promoterId: string;
  promoterData: {
    id_card_number?: string;
    id_card_expiry_date?: string;
    id_card_url?: string;
    passport_number?: string;
    passport_expiry_date?: string;
    passport_url?: string;
  };
  isAdmin: boolean;
  onDocumentUpload?: (documentType: string) => void;
  onDocumentView?: (documentType: string) => void;
}

export function PromoterComplianceTracker({
  promoterId,
  promoterData,
  isAdmin,
  onDocumentUpload,
  onDocumentView,
}: PromoterComplianceTrackerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [complianceRequirements, setComplianceRequirements] = useState<
    ComplianceRequirement[]
  >([]);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'critical' | 'expiring' | 'missing'
  >('all');
  const [showReminders, setShowReminders] = useState(true);

  // Initialize documents
  useEffect(() => {
    initializeDocuments();
    initializeComplianceRequirements();
  }, [promoterId, promoterData]);

  const initializeDocuments = () => {
    const docs: Document[] = [
      {
        id: '1',
        type: 'id_card',
        name: 'National ID Card',
        number: promoterData.id_card_number,
        expiryDate: promoterData.id_card_expiry_date,
        url: promoterData.id_card_url,
        status: getDocumentStatus(
          promoterData.id_card_expiry_date,
          promoterData.id_card_url
        ),
        isRequired: true,
        priority: 'critical',
        category: 'identity',
        reminderDays: [30, 15, 7, 3, 1],
      },
      {
        id: '2',
        type: 'passport',
        name: 'Passport',
        number: promoterData.passport_number,
        expiryDate: promoterData.passport_expiry_date,
        url: promoterData.passport_url,
        status: getDocumentStatus(
          promoterData.passport_expiry_date,
          promoterData.passport_url
        ),
        isRequired: false,
        priority: 'high',
        category: 'identity',
        reminderDays: [60, 30, 15],
      },
      {
        id: '3',
        type: 'work_permit',
        name: 'Work Permit',
        status: 'missing',
        isRequired: true,
        priority: 'critical',
        category: 'legal',
        reminderDays: [30, 15, 7],
      },
      {
        id: '4',
        type: 'health_certificate',
        name: 'Health Certificate',
        status: 'missing',
        isRequired: true,
        priority: 'high',
        category: 'medical',
        reminderDays: [30, 15],
      },
      {
        id: '5',
        type: 'criminal_record',
        name: 'Criminal Record Check',
        status: 'missing',
        isRequired: false,
        priority: 'medium',
        category: 'legal',
        reminderDays: [30],
      },
      {
        id: '6',
        type: 'contract',
        name: 'Employment Contract',
        status: 'pending_review',
        isRequired: true,
        priority: 'critical',
        category: 'legal',
        reminderDays: [15, 7],
      },
      {
        id: '7',
        type: 'training_certificate',
        name: 'Training Certificates',
        status: 'missing',
        isRequired: false,
        priority: 'low',
        category: 'professional',
        reminderDays: [30],
      },
      {
        id: '8',
        type: 'insurance',
        name: 'Insurance Document',
        status: 'missing',
        isRequired: true,
        priority: 'high',
        category: 'legal',
        reminderDays: [30, 15, 7],
      },
    ];

    setDocuments(docs);
  };

  const initializeComplianceRequirements = () => {
    const requirements: ComplianceRequirement[] = [
      {
        id: '1',
        name: 'Legal Employment Compliance',
        description: 'All legal documents required for employment',
        documents: ['id_card', 'work_permit', 'contract'],
        isMandatory: true,
        status: 'non_compliant',
      },
      {
        id: '2',
        name: 'Health & Safety Compliance',
        description: 'Health and safety requirements',
        documents: ['health_certificate', 'insurance'],
        isMandatory: true,
        status: 'non_compliant',
      },
      {
        id: '3',
        name: 'Professional Qualifications',
        description: 'Professional certifications and training',
        documents: ['training_certificate'],
        isMandatory: false,
        status: 'pending',
      },
      {
        id: '4',
        name: 'Background Verification',
        description: 'Background and identity verification',
        documents: ['id_card', 'passport', 'criminal_record'],
        isMandatory: true,
        status: 'pending',
      },
    ];

    setComplianceRequirements(requirements);
  };

  const getDocumentStatus = (
    expiryDate?: string,
    url?: string
  ): Document['status'] => {
    if (!url) return 'missing';
    if (!expiryDate) return 'valid';

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'valid';
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'expiring_soon':
        return <AlertTriangle className='h-5 w-5 text-yellow-500' />;
      case 'expired':
        return <XCircle className='h-5 w-5 text-red-500' />;
      case 'missing':
        return <FileText className='h-5 w-5 text-gray-400' />;
      case 'pending_review':
        return <Clock className='h-5 w-5 text-blue-500' />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'missing':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pending_review':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityColor = (priority: Document['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: Document['category']) => {
    switch (category) {
      case 'identity':
        return <Shield className='h-4 w-4' />;
      case 'legal':
        return <FileCheck className='h-4 w-4' />;
      case 'medical':
        return <AlertCircle className='h-4 w-4' />;
      case 'professional':
        return <TrendingUp className='h-4 w-4' />;
    }
  };

  // Calculate overall compliance score
  const complianceScore = useMemo(() => {
    const requiredDocs = documents.filter(d => d.isRequired);
    const validDocs = requiredDocs.filter(
      d => d.status === 'valid' || d.status === 'pending_review'
    );
    return Math.round((validDocs.length / requiredDocs.length) * 100) || 0;
  }, [documents]);

  // Get critical alerts
  const criticalAlerts = useMemo(() => {
    return documents.filter(
      d =>
        (d.status === 'expired' && d.isRequired) ||
        (d.status === 'expiring_soon' && d.priority === 'critical')
    );
  }, [documents]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    switch (activeFilter) {
      case 'critical':
        return doc.priority === 'critical';
      case 'expiring':
        return doc.status === 'expiring_soon' || doc.status === 'expired';
      case 'missing':
        return doc.status === 'missing';
      default:
        return true;
    }
  });

  return (
    <div className='space-y-6'>
      {/* Header with Compliance Score */}
      <Card
        className={`border-2 ${complianceScore >= 90 ? 'border-green-200 bg-green-50' : complianceScore >= 70 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}
      >
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div
                className={`p-4 rounded-full ${complianceScore >= 90 ? 'bg-green-100' : complianceScore >= 70 ? 'bg-yellow-100' : 'bg-red-100'}`}
              >
                <Shield
                  className={`h-8 w-8 ${complianceScore >= 90 ? 'text-green-600' : complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
                />
              </div>
              <div>
                <h3 className='text-2xl font-bold'>{complianceScore}%</h3>
                <p className='text-sm text-gray-600'>
                  Overall Compliance Score
                </p>
                <Badge
                  className={`mt-1 ${complianceScore >= 90 ? 'bg-green-500' : complianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                >
                  {complianceScore >= 90
                    ? 'Fully Compliant'
                    : complianceScore >= 70
                      ? 'Partially Compliant'
                      : 'Non-Compliant'}
                </Badge>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {documents.filter(d => d.status === 'valid').length}
                </div>
                <div className='text-xs text-gray-500'>Valid</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-yellow-600'>
                  {documents.filter(d => d.status === 'expiring_soon').length}
                </div>
                <div className='text-xs text-gray-500'>Expiring</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-red-600'>
                  {
                    documents.filter(
                      d => d.status === 'expired' || d.status === 'missing'
                    ).length
                  }
                </div>
                <div className='text-xs text-gray-500'>Action Required</div>
              </div>
            </div>
          </div>
          <Progress value={complianceScore} className='mt-4 h-2' />
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && showReminders && (
        <Alert variant='destructive' className='border-2'>
          <AlertTriangle className='h-5 w-5' />
          <div className='flex items-start justify-between flex-1'>
            <div>
              <h4 className='font-semibold mb-2'>Critical Compliance Alerts</h4>
              <AlertDescription>
                <ul className='list-disc list-inside space-y-1'>
                  {criticalAlerts.map(doc => (
                    <li key={doc.id}>
                      <span className='font-medium'>{doc.name}</span> -{' '}
                      {doc.status.replace('_', ' ')}
                      {doc.expiryDate &&
                        ` (Expires: ${format(new Date(doc.expiryDate), 'MMM dd, yyyy')})`}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowReminders(false)}
            >
              <XCircle className='h-4 w-4' />
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter Buttons */}
      <div className='flex flex-wrap gap-2'>
        {(['all', 'critical', 'expiring', 'missing'] as const).map(filter => (
          <Button
            key={filter}
            variant={activeFilter === filter ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'all' && `All Documents (${documents.length})`}
            {filter === 'critical' &&
              `Critical (${documents.filter(d => d.priority === 'critical').length})`}
            {filter === 'expiring' &&
              `Expiring (${documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired').length})`}
            {filter === 'missing' &&
              `Missing (${documents.filter(d => d.status === 'missing').length})`}
          </Button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {filteredDocuments.map(doc => (
          <Card
            key={doc.id}
            className={`border-2 ${getStatusColor(doc.status)}`}
          >
            <CardContent className='p-4'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-start gap-3'>
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(doc.status)}`}
                  >
                    {getStatusIcon(doc.status)}
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-semibold text-sm'>{doc.name}</h4>
                      {doc.isRequired && (
                        <Badge variant='outline' className='text-xs'>
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge
                        className={`text-xs ${getPriorityColor(doc.priority)} bg-transparent border`}
                      >
                        {doc.priority}
                      </Badge>
                      <div className='flex items-center gap-1 text-xs text-gray-500'>
                        {getCategoryIcon(doc.category)}
                        {doc.category}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(doc.status)}>
                  {doc.status.replace('_', ' ')}
                </Badge>
              </div>

              {doc.number && (
                <p className='text-xs text-gray-600 mb-2'>
                  <span className='font-medium'>Number:</span> {doc.number}
                </p>
              )}

              {doc.expiryDate && (
                <div className='mb-3'>
                  <div className='flex items-center justify-between text-xs mb-1'>
                    <span className='text-gray-600'>Expiry Date:</span>
                    <span className='font-medium'>
                      {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {doc.status !== 'expired' && (
                    <div className='flex items-center gap-2 text-xs text-gray-500'>
                      <Clock className='h-3 w-3' />
                      {differenceInDays(
                        new Date(doc.expiryDate),
                        new Date()
                      )}{' '}
                      days remaining
                    </div>
                  )}
                </div>
              )}

              <div className='flex gap-2 mt-3'>
                {doc.url && (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onDocumentView?.(doc.type)}
                      className='flex-1'
                    >
                      <Eye className='h-3 w-3 mr-1' />
                      View
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => window.open(doc.url, '_blank')}
                      className='flex-1'
                    >
                      <Download className='h-3 w-3 mr-1' />
                      Download
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button
                    variant={doc.url ? 'outline' : 'default'}
                    size='sm'
                    onClick={() => onDocumentUpload?.(doc.type)}
                    className='flex-1'
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    {doc.url ? 'Update' : 'Upload'}
                  </Button>
                )}
              </div>

              {/* Reminder Schedule */}
              {doc.reminderDays.length > 0 && doc.expiryDate && (
                <div className='mt-3 pt-3 border-t'>
                  <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
                    <Bell className='h-3 w-3' />
                    Reminder Schedule:
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {doc.reminderDays.map(days => (
                      <Badge key={days} variant='outline' className='text-xs'>
                        {days} days
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileCheck className='h-5 w-5' />
            Compliance Requirements
          </CardTitle>
          <CardDescription>
            Track compliance against key requirements
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {complianceRequirements.map(req => {
            const reqDocs = documents.filter(d =>
              req.documents.includes(d.type)
            );
            const compliantDocs = reqDocs.filter(
              d => d.status === 'valid' || d.status === 'pending_review'
            );
            const progress = (compliantDocs.length / reqDocs.length) * 100;

            return (
              <div key={req.id} className='p-4 border rounded-lg'>
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-semibold text-sm'>{req.name}</h4>
                      {req.isMandatory && (
                        <Badge
                          variant='outline'
                          className='text-xs bg-red-100 text-red-700'
                        >
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      {req.description}
                    </p>
                  </div>
                  <Badge
                    className={
                      progress === 100
                        ? 'bg-green-500'
                        : progress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }
                  >
                    {progress.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={progress} className='h-2 mb-2' />
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <span>
                    {compliantDocs.length} of {reqDocs.length} documents
                    compliant
                  </span>
                  <span className='flex items-center gap-1'>
                    <FileClock className='h-3 w-3' />
                    {
                      reqDocs.filter(d => d.status === 'expiring_soon').length
                    }{' '}
                    expiring soon
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' size='sm'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh Documents
              </Button>
              <Button variant='outline' size='sm'>
                <Bell className='h-4 w-4 mr-2' />
                Send Reminders
              </Button>
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export Compliance Report
              </Button>
              <Button variant='outline' size='sm'>
                <Calendar className='h-4 w-4 mr-2' />
                Schedule Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
