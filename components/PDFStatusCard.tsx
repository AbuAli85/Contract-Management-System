import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileTextIcon,
  MailIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from 'lucide-react';

interface PDFStatusCardProps {
  contract: any;
  pdfStatus: {
    can_download: boolean;
    has_pdf: boolean;
    pdf_url?: string;
    is_processing: boolean;
    notifications: any[];
  };
  downloading: boolean;
  onDownload: () => void;
  onRefresh: () => void;
}

export function PDFStatusCard({
  contract,
  pdfStatus,
  downloading,
  onDownload,
  onRefresh,
}: PDFStatusCardProps) {
  const isApproved = contract?.approval_status === 'active';
  const hasPDF = !!contract?.pdf_url;

  if (!isApproved) {
    return null;
  }

  return (
    <Card className='shadow-lg'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileTextIcon className='h-5 w-5' />
          PDF & Email Status
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Status Summary */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <FileTextIcon className='h-5 w-5 text-blue-600' />
              <h4 className='font-medium text-blue-900'>PDF Status</h4>
            </div>
            <p className='text-sm text-blue-700'>
              {hasPDF ? 'Generated' : 'Not generated'}
            </p>
            {hasPDF && contract.pdf_url && (
              <Button size='sm' variant='outline' className='mt-2' asChild>
                <a
                  href={contract.pdf_url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ExternalLinkIcon className='mr-2 h-4 w-4' />
                  View PDF
                </a>
              </Button>
            )}
          </div>

          <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <MailIcon className='h-5 w-5 text-green-600' />
              <h4 className='font-medium text-green-900'>Email Status</h4>
            </div>
            <p className='text-sm text-green-700'>
              {hasPDF ? 'Sent to client & employer' : 'Pending PDF generation'}
            </p>
          </div>

          <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <CheckCircleIcon className='h-5 w-5 text-purple-600' />
              <h4 className='font-medium text-purple-900'>Approval Status</h4>
            </div>
            <p className='text-sm text-purple-700'>
              {isApproved
                ? 'Fully approved'
                : contract.approval_status || 'Not submitted'}
            </p>
          </div>
        </div>

        {/* Recent Notifications */}
        {Array.isArray(pdfStatus.notifications) &&
          pdfStatus.notifications.length > 0 && (
            <div>
              <h4 className='mb-3 font-medium text-gray-900'>
                Recent Activity
              </h4>
              <div className='space-y-2'>
                {pdfStatus.notifications
                  .slice(0, 3)
                  .map((notification, index) => (
                    <div
                      key={index}
                      className='rounded-lg border border-gray-200 bg-gray-50 p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-900'>
                            {notification.title}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {notification.message}
                          </p>
                        </div>
                        <span className='text-xs text-gray-500'>
                          {new Date(
                            notification.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Manual Actions */}
        {isApproved && !hasPDF && (
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <h4 className='mb-2 font-medium text-yellow-900'>Manual Actions</h4>
            <div className='flex items-center gap-2'>
              <Button size='sm' onClick={onDownload} disabled={downloading}>
                {downloading ? (
                  <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <DownloadIcon className='mr-2 h-4 w-4' />
                )}
                {downloading ? 'Processing...' : 'Generate PDF & Send Email'}
              </Button>
              <Button size='sm' variant='outline' onClick={onRefresh}>
                <RefreshCwIcon className='mr-2 h-4 w-4' />
                Refresh Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
