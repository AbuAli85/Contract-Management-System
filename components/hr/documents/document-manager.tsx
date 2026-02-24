'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DocumentUploadDialog } from '@/components/hr/documents/document-upload-dialog';
import { DocumentViewDialog } from '@/components/hr/documents/document-view-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCompany } from '@/components/providers/company-provider';

interface Document {
  id: string;
  employer_employee_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  expiry_date?: string;
  issue_date?: string;
  issuing_authority?: string;
  document_number?: string;
  status: 'pending' | 'verified' | 'expired' | 'rejected' | 'renewed';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employer_employee?: {
    id: string;
    employee: {
      id: string;
      name_en?: string;
      name_ar?: string;
      email?: string;
    };
  };
}

interface DocumentManagerProps {
  employerEmployeeId?: string;
  locale?: string;
}

export function DocumentManager({
  employerEmployeeId,
  locale = 'en',
}: DocumentManagerProps) {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  // Fetch documents
  const {
    data: documentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['documents', employerEmployeeId, companyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employerEmployeeId) {
        params.append('employer_employee_id', employerEmployeeId);
      }

      const response = await fetch(`/api/hr/documents?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return response.json();
    },
  });

  const documents: Document[] = documentsData?.documents || [];

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employer_employee?.employee?.name_en
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      doc.employer_employee?.employee?.name_ar
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || doc.document_type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/hr/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: locale === 'ar' ? 'تم الحذف بنجاح' : 'Document Deleted',
        description:
          locale === 'ar'
            ? 'تم حذف المستند بنجاح'
            : 'Document has been deleted successfully',
      });
    },
    onError: error => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className='bg-green-500 hover:bg-green-600'>
            <CheckCircle className='h-3 w-3 mr-1' />
            {locale === 'ar' ? 'متحقق' : 'Verified'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-500 hover:bg-yellow-600'>
            <Clock className='h-3 w-3 mr-1' />
            {locale === 'ar' ? 'قيد الانتظار' : 'Pending'}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className='bg-red-500 hover:bg-red-600'>
            <AlertTriangle className='h-3 w-3 mr-1' />
            {locale === 'ar' ? 'منتهي' : 'Expired'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-500 hover:bg-red-600'>
            <XCircle className='h-3 w-3 mr-1' />
            {locale === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      id_card: { en: 'ID Card', ar: 'بطاقة الهوية' },
      passport: { en: 'Passport', ar: 'جواز السفر' },
      contract: { en: 'Contract', ar: 'عقد' },
      certificate: { en: 'Certificate', ar: 'شهادة' },
      training_certificate: { en: 'Training Certificate', ar: 'شهادة تدريب' },
      license: { en: 'License', ar: 'رخصة' },
      visa: { en: 'Visa', ar: 'تأشيرة' },
      work_permit: { en: 'Work Permit', ar: 'تصريح عمل' },
      insurance: { en: 'Insurance', ar: 'تأمين' },
      other: { en: 'Other', ar: 'أخرى' },
    };

    return labels[type]?.[locale as 'en' | 'ar'] || type;
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return expiry >= today && expiry <= thirtyDaysFromNow;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'المستندات' : 'Documents'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'المستندات' : 'Documents'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-red-600'>
            {locale === 'ar'
              ? 'فشل تحميل المستندات'
              : 'Failed to load documents'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                {locale === 'ar' ? 'إدارة المستندات' : 'Document Management'}
              </CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? `إجمالي المستندات: ${documents.length}`
                  : `Total Documents: ${documents.length}`}
              </CardDescription>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              {locale === 'ar' ? 'رفع مستند' : 'Upload Document'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 mb-6'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue
                  placeholder={
                    locale === 'ar' ? 'نوع المستند' : 'Document Type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {locale === 'ar' ? 'الكل' : 'All Types'}
                </SelectItem>
                <SelectItem value='id_card'>
                  {locale === 'ar' ? 'بطاقة الهوية' : 'ID Card'}
                </SelectItem>
                <SelectItem value='passport'>
                  {locale === 'ar' ? 'جواز السفر' : 'Passport'}
                </SelectItem>
                <SelectItem value='contract'>
                  {locale === 'ar' ? 'عقد' : 'Contract'}
                </SelectItem>
                <SelectItem value='certificate'>
                  {locale === 'ar' ? 'شهادة' : 'Certificate'}
                </SelectItem>
                <SelectItem value='license'>
                  {locale === 'ar' ? 'رخصة' : 'License'}
                </SelectItem>
                <SelectItem value='visa'>
                  {locale === 'ar' ? 'تأشيرة' : 'Visa'}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue
                  placeholder={locale === 'ar' ? 'الحالة' : 'Status'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {locale === 'ar' ? 'الكل' : 'All Status'}
                </SelectItem>
                <SelectItem value='verified'>
                  {locale === 'ar' ? 'متحقق' : 'Verified'}
                </SelectItem>
                <SelectItem value='pending'>
                  {locale === 'ar' ? 'قيد الانتظار' : 'Pending'}
                </SelectItem>
                <SelectItem value='expired'>
                  {locale === 'ar' ? 'منتهي' : 'Expired'}
                </SelectItem>
                <SelectItem value='rejected'>
                  {locale === 'ar' ? 'مرفوض' : 'Rejected'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Table */}
          {filteredDocuments.length === 0 ? (
            <div className='text-center py-12 text-gray-500'>
              <FileText className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>
                {locale === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
              </p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {locale === 'ar' ? 'اسم المستند' : 'Document Name'}
                    </TableHead>
                    <TableHead>{locale === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>
                      {locale === 'ar' ? 'الموظف' : 'Employee'}
                    </TableHead>
                    <TableHead>
                      {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                    </TableHead>
                    <TableHead>
                      {locale === 'ar' ? 'الحالة' : 'Status'}
                    </TableHead>
                    <TableHead>
                      {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map(doc => (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        isExpiringSoon(doc.expiry_date) && 'bg-yellow-50',
                        doc.status === 'expired' && 'bg-red-50'
                      )}
                    >
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-gray-400' />
                          {doc.document_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDocumentTypeLabel(doc.document_type)}
                      </TableCell>
                      <TableCell>
                        {doc.employer_employee?.employee?.name_en ||
                          doc.employer_employee?.employee?.name_ar ||
                          'N/A'}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <div
                            className={cn(
                              isExpiringSoon(doc.expiry_date) &&
                                'text-yellow-600 font-medium',
                              doc.status === 'expired' &&
                                'text-red-600 font-medium'
                            )}
                          >
                            {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}
                            {isExpiringSoon(doc.expiry_date) && (
                              <AlertTriangle className='h-3 w-3 inline ml-1' />
                            )}
                          </div>
                        ) : (
                          <span className='text-gray-400'>N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedDocument(doc);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          {doc.file_url && (
                            <Button variant='ghost' size='sm' asChild>
                              <a
                                href={doc.file_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                aria-label={
                                  locale === 'ar'
                                    ? 'تحميل المستند'
                                    : 'Download document'
                                }
                              >
                                <Download className='h-4 w-4' />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              if (
                                confirm(
                                  locale === 'ar'
                                    ? 'هل أنت متأكد من الحذف؟'
                                    : 'Are you sure you want to delete this document?'
                                )
                              ) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        employerEmployeeId={employerEmployeeId}
        locale={locale}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          setUploadDialogOpen(false);
        }}
      />

      {/* View Dialog */}
      {selectedDocument && (
        <DocumentViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          document={selectedDocument}
          locale={locale}
        />
      )}
    </div>
  );
}
