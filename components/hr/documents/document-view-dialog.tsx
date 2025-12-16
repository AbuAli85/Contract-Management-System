'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Calendar, Building2, Hash, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
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
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employer_employee?: {
    employee: {
      name_en?: string;
      name_ar?: string;
      email?: string;
    };
  };
}

interface DocumentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  locale?: string;
}

export function DocumentViewDialog({
  open,
  onOpenChange,
  document,
  locale = 'en',
}: DocumentViewDialogProps) {
  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'متحقق' : 'Verified'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'قيد الانتظار' : 'Pending'}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'منتهي' : 'Expired'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.document_name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {locale === 'ar' ? 'تفاصيل المستند' : 'Document Details'}
              </DialogDescription>
            </div>
            {getStatusBadge(document.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                {locale === 'ar' ? 'نوع المستند' : 'Document Type'}
              </label>
              <p className="mt-1 text-sm">{document.document_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {locale === 'ar' ? 'الموظف' : 'Employee'}
              </label>
              <p className="mt-1 text-sm">
                {document.employer_employee?.employee?.name_en ||
                  document.employer_employee?.employee?.name_ar ||
                  'N/A'}
              </p>
            </div>
            {document.document_number && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {locale === 'ar' ? 'رقم المستند' : 'Document Number'}
                </label>
                <p className="mt-1 text-sm">{document.document_number}</p>
              </div>
            )}
            {document.issuing_authority && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {locale === 'ar' ? 'جهة الإصدار' : 'Issuing Authority'}
                </label>
                <p className="mt-1 text-sm">{document.issuing_authority}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {document.issue_date && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}
                </label>
                <p className="mt-1 text-sm">
                  {format(new Date(document.issue_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {document.expiry_date && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                </label>
                <p className="mt-1 text-sm">
                  {format(new Date(document.expiry_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          <Separator />
          <div>
            <label className="text-sm font-medium text-gray-500">
              {locale === 'ar' ? 'معلومات الملف' : 'File Information'}
            </label>
            <div className="mt-2 space-y-1">
              {document.file_name && (
                <p className="text-sm">
                  <span className="font-medium">{locale === 'ar' ? 'الاسم:' : 'Name:'}</span>{' '}
                  {document.file_name}
                </p>
              )}
              {document.file_size && (
                <p className="text-sm">
                  <span className="font-medium">{locale === 'ar' ? 'الحجم:' : 'Size:'}</span>{' '}
                  {formatFileSize(document.file_size)}
                </p>
              )}
              {document.mime_type && (
                <p className="text-sm">
                  <span className="font-medium">{locale === 'ar' ? 'النوع:' : 'Type:'}</span>{' '}
                  {document.mime_type}
                </p>
              )}
            </div>
          </div>

          {/* Verification Info */}
          {document.verified_at && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {locale === 'ar' ? 'معلومات التحقق' : 'Verification Information'}
                </label>
                <p className="mt-1 text-sm">
                  {locale === 'ar' ? 'تم التحقق في' : 'Verified on'}{' '}
                  {format(new Date(document.verified_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </>
          )}

          {/* Rejection Reason */}
          {document.status === 'rejected' && document.rejection_reason && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-red-600">
                  {locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}
                </label>
                <p className="mt-1 text-sm text-red-600">{document.rejection_reason}</p>
              </div>
            </>
          )}

          {/* Notes */}
          {document.notes && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {locale === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{document.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex justify-end gap-2">
            {document.file_url && (
              <Button asChild>
                <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'تحميل' : 'Download'}
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {locale === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

