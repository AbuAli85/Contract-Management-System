'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  FileText,
  Mail,
  MessageSquare,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkDocumentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPromoterIds: string[];
  selectedPromoterNames: string[];
  onSuccess?: () => void;
}

type DocumentType = 'id_card' | 'passport' | 'both';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type DeadlineOption = 'none' | '7days' | '14days' | '30days' | 'custom';

export function BulkDocumentRequestDialog({
  open,
  onOpenChange,
  selectedPromoterIds,
  selectedPromoterNames,
  onSuccess,
}: BulkDocumentRequestDialogProps) {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<DocumentType>('id_card');
  const [priority, setPriority] = useState<Priority>('medium');
  const [reason, setReason] = useState('');
  const [deadlineOption, setDeadlineOption] =
    useState<DeadlineOption>('14days');
  const [customDeadline, setCustomDeadline] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDeadlineDate = (): string | undefined => {
    if (deadlineOption === 'none') return undefined;
    if (deadlineOption === 'custom') return customDeadline;

    const days = parseInt(deadlineOption.replace('days', ''));
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const deadline = getDeadlineDate();

      // Call bulk document request API
      const response = await fetch('/api/promoters/bulk-document-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoterIds: selectedPromoterIds,
          documentType,
          priority,
          reason: reason.trim() || undefined,
          deadline,
          sendEmail,
          sendSms,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send document requests');
      }

      // Show success toast with details
      toast({
        title: '✅ Document Requests Sent',
        description: (
          <div className='space-y-2'>
            <p className='font-semibold'>
              Successfully sent to {data.results.successCount} of{' '}
              {data.results.totalCount} promoters
            </p>
            {data.results.failureCount > 0 && (
              <p className='text-sm text-amber-600'>
                {data.results.failureCount} requests failed
              </p>
            )}
            <div className='flex gap-2 text-xs'>
              {data.results.emailsSent > 0 && (
                <Badge variant='outline' className='gap-1'>
                  <Mail className='h-3 w-3' />
                  {data.results.emailsSent} emails
                </Badge>
              )}
              {data.results.smsSent > 0 && (
                <Badge variant='outline' className='gap-1'>
                  <MessageSquare className='h-3 w-3' />
                  {data.results.smsSent} SMS
                </Badge>
              )}
            </div>
          </div>
        ),
      });

      // Close dialog and trigger refresh
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setDocumentType('id_card');
      setPriority('medium');
      setReason('');
      setDeadlineOption('14days');
      setSendEmail(true);
      setSendSms(false);
    } catch (error) {
      console.error('Error sending bulk document requests:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to send document requests',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-indigo-600' />
            Bulk Document Request
          </DialogTitle>
          <DialogDescription>
            Request documents from {selectedPromoterIds.length} selected
            promoter{selectedPromoterIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Selected Promoters Preview */}
          <div className='rounded-lg bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700'>
            <p className='text-sm font-medium mb-2'>Selected Promoters:</p>
            <div className='flex flex-wrap gap-1 max-h-24 overflow-y-auto'>
              {selectedPromoterNames.slice(0, 10).map((name, idx) => (
                <Badge key={idx} variant='secondary' className='text-xs'>
                  {name}
                </Badge>
              ))}
              {selectedPromoterNames.length > 10 && (
                <Badge variant='secondary' className='text-xs'>
                  +{selectedPromoterNames.length - 10} more
                </Badge>
              )}
            </div>
          </div>

          {/* Document Type Selection */}
          <div className='space-y-2'>
            <Label htmlFor='documentType'>Document Type *</Label>
            <Select
              value={documentType}
              onValueChange={value => setDocumentType(value as DocumentType)}
            >
              <SelectTrigger id='documentType'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='id_card'>ID Card Only</SelectItem>
                <SelectItem value='passport'>Passport Only</SelectItem>
                <SelectItem value='both'>Both ID Card & Passport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className='space-y-2'>
            <Label htmlFor='priority'>Priority Level *</Label>
            <Select
              value={priority}
              onValueChange={value => setPriority(value as Priority)}
            >
              <SelectTrigger id='priority'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='low'>Low - Standard request</SelectItem>
                <SelectItem value='medium'>Medium - Important</SelectItem>
                <SelectItem value='high'>High - Urgent</SelectItem>
                <SelectItem value='urgent'>Urgent - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className='space-y-2'>
            <Label htmlFor='reason'>Reason (Optional)</Label>
            <Textarea
              id='reason'
              placeholder='e.g., Document renewal required for contract assignment...'
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className='text-xs text-muted-foreground'>
              {reason.length}/500 characters
            </p>
          </div>

          {/* Deadline Selection */}
          <div className='space-y-2'>
            <Label htmlFor='deadline'>Submission Deadline</Label>
            <Select
              value={deadlineOption}
              onValueChange={value =>
                setDeadlineOption(value as DeadlineOption)
              }
            >
              <SelectTrigger id='deadline'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No specific deadline</SelectItem>
                <SelectItem value='7days'>7 days from now</SelectItem>
                <SelectItem value='14days'>14 days from now</SelectItem>
                <SelectItem value='30days'>30 days from now</SelectItem>
                <SelectItem value='custom'>Custom date</SelectItem>
              </SelectContent>
            </Select>
            {deadlineOption === 'custom' && (
              <input
                type='date'
                value={customDeadline}
                onChange={e => setCustomDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900'
                aria-label='Custom deadline date'
                title='Select custom deadline date'
              />
            )}
          </div>

          {/* Notification Channels */}
          <div className='space-y-3'>
            <Label>Notification Channels</Label>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='sendEmail'
                  checked={sendEmail}
                  onCheckedChange={checked => setSendEmail(checked as boolean)}
                />
                <label
                  htmlFor='sendEmail'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2'
                >
                  <Mail className='h-4 w-4' />
                  Send Email Notification
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='sendSms'
                  checked={sendSms}
                  onCheckedChange={checked => setSendSms(checked as boolean)}
                />
                <label
                  htmlFor='sendSms'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2'
                >
                  <MessageSquare className='h-4 w-4' />
                  Send SMS Notification{' '}
                  {priority === 'urgent' && '(Recommended)'}
                </label>
              </div>
            </div>
          </div>

          {/* Warning for urgent priority */}
          {priority === 'urgent' && (
            <div className='flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
              <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5' />
              <div className='text-sm text-amber-800 dark:text-amber-200'>
                <strong>Urgent Priority:</strong> This will send immediate
                notifications to all selected promoters. Consider enabling SMS
                for critical requests.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!sendEmail && !sendSms)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Send Requests ({selectedPromoterIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
