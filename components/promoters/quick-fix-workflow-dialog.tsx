'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  Mail,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DashboardPromoter } from './types';
import { cn } from '@/lib/utils';

interface QuickFixWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promoters: DashboardPromoter[];
  onSuccess?: () => void;
}

interface CriticalCase {
  promoter: DashboardPromoter;
  issues: string[];
  actions: Array<{
    type: 'reminder' | 'document_request';
    description: string;
    documentType?: 'id_card' | 'passport';
  }>;
  severity: 'critical' | 'high';
  selected: boolean;
}

export function QuickFixWorkflowDialog({
  open,
  onOpenChange,
  promoters,
  onSuccess,
}: QuickFixWorkflowDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  // Identify critical cases that need immediate action
  const criticalCases = useMemo<CriticalCase[]>(() => {
    return promoters
      .map((promoter): CriticalCase | null => {
        const issues: string[] = [];
        const actions: CriticalCase['actions'] = [];
        let severity: 'critical' | 'high' = 'high';

        // Check for critical ID card issues
        if (promoter.idDocument.status === 'expired') {
          const daysOverdue = Math.abs(promoter.idDocument.daysRemaining || 0);
          issues.push(`ID Card expired ${daysOverdue} days ago`);
          actions.push({
            type: 'reminder',
            description: `Send urgent renewal reminder for ID Card`,
            documentType: 'id_card',
          });
          severity = 'critical';
        } else if (
          promoter.idDocument.status === 'expiring' &&
          (promoter.idDocument.daysRemaining || 0) <= 3
        ) {
          const days = promoter.idDocument.daysRemaining || 0;
          issues.push(`ID Card expires in ${days} day${days !== 1 ? 's' : ''}`);
          actions.push({
            type: 'reminder',
            description: `Send urgent renewal reminder for ID Card`,
            documentType: 'id_card',
          });
          severity = 'critical';
        } else if (promoter.idDocument.status === 'missing') {
          issues.push('ID Card not provided');
          actions.push({
            type: 'document_request',
            description: 'Request ID Card submission',
            documentType: 'id_card',
          });
        }

        // Check for passport issues
        if (promoter.passportDocument.status === 'expired') {
          const daysOverdue = Math.abs(
            promoter.passportDocument.daysRemaining || 0
          );
          issues.push(`Passport expired ${daysOverdue} days ago`);
          actions.push({
            type: 'reminder',
            description: 'Send renewal reminder for Passport',
            documentType: 'passport',
          });
        } else if (
          promoter.passportDocument.status === 'expiring' &&
          (promoter.passportDocument.daysRemaining || 0) <= 3
        ) {
          const days = promoter.passportDocument.daysRemaining || 0;
          issues.push(
            `Passport expires in ${days} day${days !== 1 ? 's' : ''}`
          );
          actions.push({
            type: 'reminder',
            description: 'Send renewal reminder for Passport',
            documentType: 'passport',
          });
        } else if (promoter.passportDocument.status === 'missing') {
          issues.push('Passport not provided');
          actions.push({
            type: 'document_request',
            description: 'Request Passport submission',
            documentType: 'passport',
          });
        }

        // Check for missing contact information
        if (!promoter.contactEmail) {
          issues.push('No email address');
        }

        // Only return if there are critical/high priority issues
        if (issues.length > 0 && actions.length > 0) {
          return {
            promoter,
            issues,
            actions,
            severity,
            selected: severity === 'critical', // Auto-select critical cases
          };
        }

        return null;
      })
      .filter((c): c is CriticalCase => c !== null)
      .sort((a, b) => {
        // Critical first
        if (a.severity !== b.severity) {
          return a.severity === 'critical' ? -1 : 1;
        }
        // Then by number of issues
        return b.issues.length - a.issues.length;
      });
  }, [promoters]);

  const [cases, setCases] = useState<CriticalCase[]>(criticalCases);

  const stats = useMemo(() => {
    const selected = cases.filter(c => c.selected);
    return {
      total: cases.length,
      selected: selected.length,
      critical: selected.filter(c => c.severity === 'critical').length,
      reminders: selected.reduce(
        (sum, c) => sum + c.actions.filter(a => a.type === 'reminder').length,
        0
      ),
      requests: selected.reduce(
        (sum, c) =>
          sum + c.actions.filter(a => a.type === 'document_request').length,
        0
      ),
    };
  }, [cases]);

  const handleToggleCase = (index: number) => {
    setCases(prev =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setCases(prev => prev.map(c => ({ ...c, selected: checked })));
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    const selectedCases = cases.filter(c => c.selected);
    const results = { success: 0, failed: 0 };

    try {
      for (let i = 0; i < selectedCases.length; i++) {
        const case_ = selectedCases[i];

        if (!case_) continue; // Skip if undefined

        try {
          // Process each action for this case
          for (const action of case_.actions) {
            if (action.type === 'reminder' && action.documentType) {
              // Send reminder
              const { sendDocumentExpiryReminder } = await import(
                '@/lib/services/promoter-notification.service'
              );

              const expiryDate =
                action.documentType === 'id_card'
                  ? case_.promoter.id_card_expiry_date
                  : case_.promoter.passport_expiry_date;

              if (expiryDate) {
                const daysRemaining =
                  action.documentType === 'id_card'
                    ? case_.promoter.idDocument.daysRemaining
                    : case_.promoter.passportDocument.daysRemaining;

                await sendDocumentExpiryReminder({
                  promoterId: case_.promoter.id,
                  documentType: action.documentType,
                  expiryDate,
                  daysBeforeExpiry: Math.max(0, daysRemaining || 0),
                });
              }
            } else if (
              action.type === 'document_request' &&
              action.documentType
            ) {
              // Request document
              const { sendDocumentRequest } = await import(
                '@/lib/services/promoter-notification.service'
              );

              await sendDocumentRequest({
                promoterId: case_.promoter.id,
                documentType: action.documentType,
                reason:
                  'Critical document missing - immediate submission required',
                priority: case_.severity === 'critical' ? 'urgent' : 'high',
                deadline: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(), // 7 days from now
              });
            }
          }

          results.success++;
        } catch (error) {
          console.error(
            `Failed to process case for ${case_.promoter.displayName}:`,
            error
          );
          results.failed++;
        }

        setProcessedCount(i + 1);

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Show success toast
      toast({
        title: '✅ Quick-Fix Complete',
        description: (
          <div className='space-y-1'>
            <p>
              Successfully processed {results.success} of {selectedCases.length}{' '}
              cases
            </p>
            {results.failed > 0 && (
              <p className='text-amber-600'>{results.failed} cases failed</p>
            )}
            <div className='flex gap-2 text-xs mt-2'>
              <Badge variant='outline'>{stats.reminders} reminders sent</Badge>
              <Badge variant='outline'>
                {stats.requests} documents requested
              </Badge>
            </div>
          </div>
        ),
      });

      // Close dialog and refresh
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error in quick-fix workflow:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to process quick-fix workflow',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessedCount(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Zap className='h-6 w-6 text-amber-500' />
            Quick-Fix Critical Issues
          </DialogTitle>
          <DialogDescription>
            Automatically send reminders and document requests for critical
            cases
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Stats Summary */}
          <div className='grid grid-cols-4 gap-3'>
            <div className='p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border'>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                {stats.total}
              </div>
              <div className='text-xs text-muted-foreground'>Total Cases</div>
            </div>
            <div className='p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'>
              <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300'>
                {stats.selected}
              </div>
              <div className='text-xs text-indigo-600 dark:text-indigo-400'>
                Selected
              </div>
            </div>
            <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
              <div className='text-2xl font-bold text-red-700 dark:text-red-300'>
                {stats.critical}
              </div>
              <div className='text-xs text-red-600 dark:text-red-400'>
                Critical
              </div>
            </div>
            <div className='p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
              <div className='text-2xl font-bold text-green-700 dark:text-green-300'>
                {stats.reminders + stats.requests}
              </div>
              <div className='text-xs text-green-600 dark:text-green-400'>
                Actions
              </div>
            </div>
          </div>

          {/* Select All */}
          <div className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='select-all'
                checked={stats.selected === stats.total}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor='select-all'
                className='text-sm font-medium cursor-pointer'
              >
                Select All Cases
              </label>
            </div>
            <div className='text-xs text-muted-foreground'>
              {stats.selected} of {stats.total} selected
            </div>
          </div>

          {/* Cases List */}
          <ScrollArea className='h-[400px] pr-4'>
            <div className='space-y-3'>
              {cases.map((case_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all',
                    case_.selected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
                    case_.severity === 'critical' && 'shadow-md'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      checked={case_.selected}
                      onCheckedChange={() => handleToggleCase(idx)}
                      className='mt-1'
                    />

                    <div className='flex-1 min-w-0 space-y-2'>
                      {/* Promoter Info */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4 text-muted-foreground' />
                          <span className='font-semibold'>
                            {case_.promoter.displayName}
                          </span>
                          {case_.severity === 'critical' && (
                            <Badge variant='destructive' className='text-xs'>
                              Critical
                            </Badge>
                          )}
                        </div>
                        {case_.promoter.contactEmail && (
                          <span className='text-xs text-muted-foreground'>
                            {case_.promoter.contactEmail}
                          </span>
                        )}
                      </div>

                      {/* Issues */}
                      <div className='flex flex-wrap gap-1'>
                        {case_.issues.map((issue, i) => (
                          <Badge key={i} variant='outline' className='text-xs'>
                            <AlertCircle className='h-3 w-3 mr-1' />
                            {issue}
                          </Badge>
                        ))}
                      </div>

                      {/* Actions to be taken */}
                      <div className='space-y-1'>
                        {case_.actions.map((action, i) => (
                          <div
                            key={i}
                            className='flex items-center gap-2 text-xs text-muted-foreground'
                          >
                            {action.type === 'reminder' ? (
                              <Mail className='h-3 w-3' />
                            ) : (
                              <FileText className='h-3 w-3' />
                            )}
                            <span>{action.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Processing Progress */}
          {isProcessing && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>Processing cases...</span>
                <span className='font-medium'>
                  {processedCount} of {stats.selected}
                </span>
              </div>
              <Progress value={(processedCount / stats.selected) * 100} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || stats.selected === 0}
            className='bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
          >
            {isProcessing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing {processedCount}/{stats.selected}...
              </>
            ) : (
              <>
                <Zap className='mr-2 h-4 w-4' />
                Process {stats.selected} Case{stats.selected !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
