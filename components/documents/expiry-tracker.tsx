'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileX,
  Filter,
  Download,
  Bell,
  Eye,
  Edit,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  DocumentService,
  type CompanyDocument,
  type DocumentExpiryStatus,
} from '@/lib/document-service';

interface ExpiryTrackerProps {
  companyId?: string; // If provided, shows documents for specific company
  showAllCompanies?: boolean; // If true, shows documents across all companies
  onDocumentUpdate?: (document: CompanyDocument) => void;
  onNotificationSent?: (documentId: string) => void;
}

interface ExpiryFilter {
  status: DocumentExpiryStatus | 'all';
  documentType: CompanyDocument['document_type'] | 'all';
  daysRange: 'all' | '7' | '30' | '90';
  sortBy: 'expiry_date' | 'company_name' | 'document_type' | 'created_at';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

interface ExpiryStatistics {
  total: number;
  expired: number;
  expiringSoon: number;
  expiring: number;
  valid: number;
  noExpiry: number;
}

const DOCUMENT_TYPE_LABELS: Record<CompanyDocument['document_type'], string> = {
  commercial_registration: 'Commercial Registration',
  business_license: 'Business License',
  tax_certificate: 'Tax Certificate',
  insurance: 'Insurance Certificate',
  logo: 'Company Logo',
  other: 'Other Documents',
};

const STATUS_CONFIG = {
  expired: {
    label: 'Expired',
    color: 'destructive',
    icon: FileX,
    bgColor: 'bg-red-50 border-red-200',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'destructive',
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 border-amber-200',
  },
  expiring: {
    label: 'Expiring',
    color: 'warning',
    icon: Clock,
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  valid: {
    label: 'Valid',
    color: 'default',
    icon: CheckCircle,
    bgColor: 'bg-green-50 border-green-200',
  },
  no_expiry: {
    label: 'No Expiry',
    color: 'secondary',
    icon: Calendar,
    bgColor: 'bg-gray-50 border-gray-200',
  },
} as const;

export function ExpiryTracker({
  companyId,
  showAllCompanies = false,
  onDocumentUpdate,
  onNotificationSent,
}: ExpiryTrackerProps) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [statistics, setStatistics] = useState<ExpiryStatistics>({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    expiring: 0,
    valid: 0,
    noExpiry: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<CompanyDocument | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ExpiryFilter>({
    status: 'all',
    documentType: 'all',
    daysRange: 'all',
    sortBy: 'expiry_date',
    sortOrder: 'asc',
    searchQuery: '',
  });

  // Load documents and statistics
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      let documentsResult;
      let statsResult;

      if (companyId) {
        // Load documents for specific company
        documentsResult =
          await DocumentService.getDocumentsByCompany(companyId);
        statsResult = await DocumentService.getExpiryStatistics(companyId);
      } else if (showAllCompanies) {
        // Load documents across all companies (admin view)
        documentsResult = await DocumentService.getAllDocumentsWithExpiry();
        statsResult = await DocumentService.getExpiryStatistics();
      } else {
        throw new Error(
          'Either companyId or showAllCompanies must be provided'
        );
      }

      if (documentsResult.error) {
        throw new Error(documentsResult.error);
      }

      if (statsResult.error) {
        throw new Error(statsResult.error);
      }

      const docs = Array.isArray(documentsResult.data)
        ? documentsResult.data
        : documentsResult.data
          ? [documentsResult.data]
          : [];
      setDocuments(docs);
      setStatistics(
        statsResult.data || {
          total: 0,
          expired: 0,
          expiringSoon: 0,
          expiring: 0,
          valid: 0,
          noExpiry: 0,
        }
      );
    } catch (err) {
      console.error('Failed to load expiry data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, showAllCompanies]);

  // Filter and sort documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = [...documents];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(doc => {
        const status = DocumentService.getExpiryStatus(doc.expiry_date || null);
        return status === filters.status;
      });
    }

    // Apply document type filter
    if (filters.documentType !== 'all') {
      filtered = filtered.filter(
        doc => doc.document_type === filters.documentType
      );
    }

    // Apply days range filter
    if (filters.daysRange !== 'all') {
      const days = parseInt(filters.daysRange);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);

      filtered = filtered.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        return expiryDate <= targetDate;
      });
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.file_name.toLowerCase().includes(query) ||
          doc.document_number?.toLowerCase().includes(query) ||
          doc.issuing_authority?.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          DOCUMENT_TYPE_LABELS[doc.document_type].toLowerCase().includes(query)
      );
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'expiry_date':
          aValue = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
          bValue = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
          break;
        case 'document_type':
          aValue = DOCUMENT_TYPE_LABELS[a.document_type];
          bValue = DOCUMENT_TYPE_LABELS[b.document_type];
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, filters]);

  const handleSendNotification = async (documentId: string) => {
    try {
      const result = await DocumentService.sendExpiryNotification(documentId);
      if (result.error) {
        setError(result.error);
      } else {
        onNotificationSent?.(documentId);
        // Optionally show success message
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send notification'
      );
    }
  };

  const formatDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return 'No expiry date';

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expired on ${expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${Math.abs(diffDays)} days ago)`;
    } else if (diffDays === 0) {
      return 'Expires today';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  const getStatusBadge = (status: DocumentExpiryStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.color as any} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <RefreshCw className='h-6 w-6 animate-spin mr-2' />
        Loading expiry data...
      </div>
    );
  }

  if (error) {
    return (
      <Alert className='border-red-200 bg-red-50'>
        <AlertTriangle className='h-4 w-4 text-red-600' />
        <AlertDescription className='text-red-700'>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Overview */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold'>{statistics.total}</div>
            <p className='text-xs text-muted-foreground'>Total Documents</p>
          </CardContent>
        </Card>

        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-700'>
              {statistics.expired}
            </div>
            <p className='text-xs text-red-600'>Expired</p>
          </CardContent>
        </Card>

        <Card className='border-amber-200 bg-amber-50'>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-amber-700'>
              {statistics.expiringSoon}
            </div>
            <p className='text-xs text-amber-600'>Expiring Soon</p>
          </CardContent>
        </Card>

        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-yellow-700'>
              {statistics.expiring}
            </div>
            <p className='text-xs text-yellow-600'>Expiring</p>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-green-50'>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-700'>
              {statistics.valid}
            </div>
            <p className='text-xs text-green-600'>Valid</p>
          </CardContent>
        </Card>

        <Card className='border-gray-200 bg-gray-50'>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-gray-700'>
              {statistics.noExpiry}
            </div>
            <p className='text-xs text-gray-600'>No Expiry</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: DocumentExpiryStatus | 'all') =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                  <SelectItem value='expiring_soon'>Expiring Soon</SelectItem>
                  <SelectItem value='expiring'>Expiring</SelectItem>
                  <SelectItem value='valid'>Valid</SelectItem>
                  <SelectItem value='no_expiry'>No Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Type</Label>
              <Select
                value={filters.documentType}
                onValueChange={(
                  value: CompanyDocument['document_type'] | 'all'
                ) => setFilters(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Days Range</Label>
              <Select
                value={filters.daysRange}
                onValueChange={(value: 'all' | '7' | '30' | '90') =>
                  setFilters(prev => ({ ...prev, daysRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Dates</SelectItem>
                  <SelectItem value='7'>Next 7 Days</SelectItem>
                  <SelectItem value='30'>Next 30 Days</SelectItem>
                  <SelectItem value='90'>Next 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={value => {
                  const [sortBy, sortOrder] = value.split('-') as [
                    ExpiryFilter['sortBy'],
                    ExpiryFilter['sortOrder'],
                  ];
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='expiry_date-asc'>
                    Expiry Date (Earliest)
                  </SelectItem>
                  <SelectItem value='expiry_date-desc'>
                    Expiry Date (Latest)
                  </SelectItem>
                  <SelectItem value='document_type-asc'>
                    Document Type (A-Z)
                  </SelectItem>
                  <SelectItem value='document_type-desc'>
                    Document Type (Z-A)
                  </SelectItem>
                  <SelectItem value='created_at-desc'>
                    Recently Added
                  </SelectItem>
                  <SelectItem value='created_at-asc'>Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search documents, numbers, authorities...'
              value={filters.searchQuery}
              onChange={e =>
                setFilters(prev => ({ ...prev, searchQuery: e.target.value }))
              }
              className='pl-10'
            />
          </div>

          <div className='flex justify-between items-center mt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={loadData}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh
              </Button>
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Document Expiry Tracking
          </CardTitle>
          <CardDescription>
            Monitor document expiry dates and take action before they expire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className='text-center py-8'>
              <Calendar className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No documents found</h3>
              <p className='text-muted-foreground'>
                {filters.status !== 'all' ||
                filters.documentType !== 'all' ||
                filters.searchQuery
                  ? 'Try adjusting your filters to see more results'
                  : 'No documents have been uploaded yet'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredDocuments.map(document => {
                const expiryStatus = DocumentService.getExpiryStatus(
                  document.expiry_date || null
                );
                const statusConfig = STATUS_CONFIG[expiryStatus];
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${statusConfig.bgColor}`}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <div>
                            <h4 className='font-semibold'>
                              {document.file_name}
                            </h4>
                            <p className='text-sm text-muted-foreground'>
                              {DOCUMENT_TYPE_LABELS[document.document_type]}
                            </p>
                          </div>
                          {getStatusBadge(expiryStatus)}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                          {document.expiry_date && (
                            <div>
                              <span className='font-medium'>Expiry Date:</span>
                              <p className='text-muted-foreground'>
                                {new Date(
                                  document.expiry_date
                                ).toLocaleDateString()}
                              </p>
                              <p
                                className={`text-xs ${
                                  expiryStatus === 'expired'
                                    ? 'text-red-600'
                                    : expiryStatus === 'expiring_soon'
                                      ? 'text-amber-600'
                                      : expiryStatus === 'expiring'
                                        ? 'text-yellow-600'
                                        : 'text-muted-foreground'
                                }`}
                              >
                                {formatDaysUntilExpiry(document.expiry_date)}
                              </p>
                            </div>
                          )}

                          {document.document_number && (
                            <div>
                              <span className='font-medium'>
                                Document Number:
                              </span>
                              <p className='text-muted-foreground'>
                                {document.document_number}
                              </p>
                            </div>
                          )}

                          {document.issuing_authority && (
                            <div>
                              <span className='font-medium'>
                                Issuing Authority:
                              </span>
                              <p className='text-muted-foreground'>
                                {document.issuing_authority}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className='font-medium'>Uploaded:</span>
                            <p className='text-muted-foreground'>
                              {new Date(
                                document.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2 ml-4'>
                        {(expiryStatus === 'expired' ||
                          expiryStatus === 'expiring_soon') && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleSendNotification(document.id)}
                          >
                            <Bell className='h-4 w-4 mr-1' />
                            Notify
                          </Button>
                        )}

                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setSelectedDocument(document);
                            setIsUpdateDialogOpen(true);
                          }}
                        >
                          <Edit className='h-4 w-4 mr-1' />
                          Update
                        </Button>

                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            DocumentService.downloadDocument(document.id)
                          }
                        >
                          <Eye className='h-4 w-4 mr-1' />
                          View
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Document Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Document</DialogTitle>
            <DialogDescription>
              Update document metadata and expiry information
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className='space-y-4'>
              <div>
                <Label>Document Name</Label>
                <Input value={selectedDocument.file_name} disabled />
              </div>

              <div>
                <Label>Document Type</Label>
                <Input
                  value={DOCUMENT_TYPE_LABELS[selectedDocument.document_type]}
                  disabled
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type='date'
                  defaultValue={
                    selectedDocument.expiry_date?.split('T')[0] || ''
                  }
                />
              </div>

              <div>
                <Label>Document Number</Label>
                <Input defaultValue={selectedDocument.document_number || ''} />
              </div>

              <div>
                <Label>Issuing Authority</Label>
                <Input
                  defaultValue={selectedDocument.issuing_authority || ''}
                />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
