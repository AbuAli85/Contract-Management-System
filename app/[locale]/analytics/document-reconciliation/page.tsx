'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReconciliationIssue {
  type: 'orphaned_file' | 'missing_url' | 'broken_link' | 'duplicate';
  severity: 'high' | 'medium' | 'low';
  promoterId?: string;
  promoterName?: string;
  fileName?: string;
  fileUrl?: string;
  documentType?: 'id_card' | 'passport';
  description: string;
  fixable: boolean;
}

interface ReconciliationStats {
  totalPromoters: number;
  promotersWithIdCard: number;
  promotersWithPassport: number;
  promotersComplete: number;
  orphanedFiles: number;
  brokenLinks: number;
  missingUrls: number;
  duplicates: number;
}

export default function DocumentReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [issues, setIssues] = useState<ReconciliationIssue[]>([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    totalPromoters: 0,
    promotersWithIdCard: 0,
    promotersWithPassport: 0,
    promotersComplete: 0,
    orphanedFiles: 0,
    brokenLinks: 0,
    missingUrls: 0,
    duplicates: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scanForIssues = async () => {
    const supabase = createClient();
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Supabase client not available',
        variant: 'destructive',
      });
      return;
    }

    setScanning(true);
    const foundIssues: ReconciliationIssue[] = [];

    try {
      // Fetch all promoters
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select(
          'id, name_en, name_ar, id_card_url, passport_url, id_card_number, passport_number'
        );

      if (promotersError) {
        console.error('Error fetching promoters:', promotersError);
        toast({
          title: 'Error',
          description: `Failed to fetch promoters: ${promotersError.message}`,
          variant: 'destructive',
        });
        return;
      }

      type PromoterRow = {
        id: string;
        name_en: string | null;
        name_ar: string | null;
        id_card_url: string | null;
        passport_url: string | null;
        id_card_number: string | null;
        passport_number: string | null;
      };
      const promotersData: PromoterRow[] =
        (promoters as PromoterRow[] | null) || [];

      // Calculate basic stats
      const withIdCard = promotersData.filter(
        p => p.id_card_url && p.id_card_url.trim() !== ''
      ).length;
      const withPassport = promotersData.filter(
        p => p.passport_url && p.passport_url.trim() !== ''
      ).length;
      const complete = promotersData.filter(
        p =>
          p.id_card_url &&
          p.id_card_url.trim() !== '' &&
          p.passport_url &&
          p.passport_url.trim() !== ''
      ).length;

      // Check for missing URLs but has document numbers
      promotersData.forEach(promoter => {
        // ID Card issues
        if (
          promoter.id_card_number &&
          (!promoter.id_card_url || promoter.id_card_url.trim() === '')
        ) {
          foundIssues.push({
            type: 'missing_url',
            severity: 'high',
            promoterId: promoter.id,
            promoterName: promoter.name_en,
            documentType: 'id_card',
            description: `${promoter.name_en} has ID number "${promoter.id_card_number}" but missing ID card URL`,
            fixable: true,
          });
        }

        // Passport issues
        if (
          promoter.passport_number &&
          (!promoter.passport_url || promoter.passport_url.trim() === '')
        ) {
          foundIssues.push({
            type: 'missing_url',
            severity: 'high',
            promoterId: promoter.id,
            promoterName: promoter.name_en,
            documentType: 'passport',
            description: `${promoter.name_en} has passport number "${promoter.passport_number}" but missing passport URL`,
            fixable: true,
          });
        }

        // No documents at all
        if (
          (!promoter.id_card_url || promoter.id_card_url.trim() === '') &&
          (!promoter.passport_url || promoter.passport_url.trim() === '')
        ) {
          foundIssues.push({
            type: 'missing_url',
            severity: 'medium',
            promoterId: promoter.id,
            promoterName: promoter.name_en,
            description: `${promoter.name_en} has no documents uploaded`,
            fixable: false,
          });
        }

        // Check for broken/invalid URLs
        if (promoter.id_card_url && !promoter.id_card_url.startsWith('http')) {
          foundIssues.push({
            type: 'broken_link',
            severity: 'high',
            promoterId: promoter.id,
            promoterName: promoter.name_en,
            fileUrl: promoter.id_card_url,
            documentType: 'id_card',
            description: `${promoter.name_en} has invalid ID card URL: "${promoter.id_card_url}"`,
            fixable: true,
          });
        }

        if (
          promoter.passport_url &&
          !promoter.passport_url.startsWith('http')
        ) {
          foundIssues.push({
            type: 'broken_link',
            severity: 'high',
            promoterId: promoter.id,
            promoterName: promoter.name_en,
            fileUrl: promoter.passport_url,
            documentType: 'passport',
            description: `${promoter.name_en} has invalid passport URL: "${promoter.passport_url}"`,
            fixable: true,
          });
        }
      });

      // Check for duplicate URLs
      const idCardUrls = new Map<string, string[]>();
      const passportUrls = new Map<string, string[]>();

      promotersData.forEach(promoter => {
        if (promoter.id_card_url && promoter.id_card_url.trim() !== '') {
          const existing = idCardUrls.get(promoter.id_card_url) || [];
          existing.push(promoter.name_en);
          idCardUrls.set(promoter.id_card_url, existing);
        }

        if (promoter.passport_url && promoter.passport_url.trim() !== '') {
          const existing = passportUrls.get(promoter.passport_url) || [];
          existing.push(promoter.name_en);
          passportUrls.set(promoter.passport_url, existing);
        }
      });

      // Find duplicates
      idCardUrls.forEach((promoterNames, url) => {
        if (promoterNames.length > 1) {
          foundIssues.push({
            type: 'duplicate',
            severity: 'medium',
            fileUrl: url,
            documentType: 'id_card',
            description: `ID card URL used by ${promoterNames.length} promoters: ${promoterNames.join(', ')}`,
            fixable: false,
          });
        }
      });

      passportUrls.forEach((promoterNames, url) => {
        if (promoterNames.length > 1) {
          foundIssues.push({
            type: 'duplicate',
            severity: 'medium',
            fileUrl: url,
            documentType: 'passport',
            description: `Passport URL used by ${promoterNames.length} promoters: ${promoterNames.join(', ')}`,
            fixable: false,
          });
        }
      });

      setStats({
        totalPromoters: promotersData.length,
        promotersWithIdCard: withIdCard,
        promotersWithPassport: withPassport,
        promotersComplete: complete,
        orphanedFiles: 0,
        brokenLinks: foundIssues.filter(i => i.type === 'broken_link').length,
        missingUrls: foundIssues.filter(i => i.type === 'missing_url').length,
        duplicates: foundIssues.filter(i => i.type === 'duplicate').length,
      });

      setIssues(foundIssues);

      toast({
        title: 'Scan Complete',
        description: `Found ${foundIssues.length} issues`,
      });
    } catch (error) {
      console.error('Error scanning for issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to scan for issues',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const autoFixIssues = async () => {
    const supabase = createClient();
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Supabase client not available',
        variant: 'destructive',
      });
      return;
    }

    setFixing(true);
    let fixedCount = 0;

    try {
      const fixableIssues = issues.filter(i => i.fixable);

      for (const issue of fixableIssues) {
        if (
          issue.type === 'broken_link' &&
          issue.promoterId &&
          issue.documentType
        ) {
          // Try to construct proper URL from broken path
          const brokenUrl = issue.fileUrl || '';

          // If it's a relative path, construct full Supabase URL
          if (brokenUrl && !brokenUrl.startsWith('http')) {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from('promoter-documents')
              .getPublicUrl(brokenUrl);

            const updateField =
              issue.documentType === 'id_card' ? 'id_card_url' : 'passport_url';

            const { error } = await supabase
              .from('promoters')
              .update({ [updateField]: publicUrl })
              .eq('id', issue.promoterId);

            if (!error) {
              fixedCount++;
            }
          }
        }
      }

      toast({
        title: 'Auto-fix Complete',
        description: `Fixed ${fixedCount} issues`,
      });

      // Rescan after fixing
      await scanForIssues();
    } catch (error) {
      console.error('Error fixing issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix some issues',
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
    }
  };

  const exportReport = () => {
    const headers = [
      'Type',
      'Severity',
      'Promoter',
      'Document Type',
      'Description',
      'Fixable',
    ];
    const rows = issues.map(issue => [
      issue.type,
      issue.severity,
      issue.promoterName || 'N/A',
      issue.documentType || 'N/A',
      issue.description,
      issue.fixable ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `document-reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    if (!isClient) return;
    scanForIssues();
  }, [isClient]);

  if (!isClient || loading) {
    return (
      <div className='flex h-[calc(100vh-150px)] items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Scanning for issues...</p>
      </div>
    );
  }

  const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
  const fixableIssues = issues.filter(i => i.fixable).length;

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Document Reconciliation
          </h1>
          <p className='text-muted-foreground mt-2'>
            Find and fix document assignment issues
          </p>
        </div>
        <div className='flex gap-3'>
          <Button onClick={scanForIssues} disabled={scanning} variant='outline'>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`}
            />
            Rescan
          </Button>
          {fixableIssues > 0 && (
            <Button onClick={autoFixIssues} disabled={fixing}>
              <LinkIcon className='h-4 w-4 mr-2' />
              Auto-fix ({fixableIssues})
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold'>{issues.length}</p>
              <p className='text-sm text-muted-foreground mt-1'>Total Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-red-200 bg-red-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <AlertTriangle className='h-8 w-8 mx-auto text-red-600 mb-2' />
              <p className='text-4xl font-bold text-red-700'>
                {highSeverityIssues}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>
                High Severity
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-green-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <CheckCircle className='h-8 w-8 mx-auto text-green-600 mb-2' />
              <p className='text-4xl font-bold text-green-700'>
                {fixableIssues}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>Auto-Fixable</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold'>{stats.promotersComplete}</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Complete Promoters
              </p>
              <p className='text-xs text-muted-foreground'>
                {stats.totalPromoters > 0
                  ? (
                      (stats.promotersComplete / stats.totalPromoters) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Breakdown */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
        <Card>
          <CardContent className='pt-6 text-center'>
            <p className='text-2xl font-bold'>{stats.missingUrls}</p>
            <p className='text-xs text-muted-foreground'>Missing URLs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 text-center'>
            <p className='text-2xl font-bold'>{stats.brokenLinks}</p>
            <p className='text-xs text-muted-foreground'>Broken Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 text-center'>
            <p className='text-2xl font-bold'>{stats.duplicates}</p>
            <p className='text-xs text-muted-foreground'>Duplicates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 text-center'>
            <p className='text-2xl font-bold'>{stats.orphanedFiles}</p>
            <p className='text-xs text-muted-foreground'>Orphaned Files</p>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Issues Found</CardTitle>
              <CardDescription>
                {issues.length} issues requiring attention
              </CardDescription>
            </div>
            {issues.length > 0 && (
              <Button onClick={exportReport} variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className='text-center py-12'>
              <CheckCircle className='h-16 w-16 mx-auto text-green-500 mb-4' />
              <p className='text-lg font-semibold'>No Issues Found!</p>
              <p className='text-muted-foreground'>
                All documents are properly assigned
              </p>
            </div>
          ) : (
            <div className='space-y-3 max-h-[600px] overflow-y-auto'>
              {issues.map((issue, index) => (
                <Card
                  key={index}
                  className='border-l-4'
                  style={{
                    borderLeftColor:
                      issue.severity === 'high'
                        ? '#ef4444'
                        : issue.severity === 'medium'
                          ? '#f59e0b'
                          : '#3b82f6',
                  }}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Badge
                            variant={
                              issue.severity === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant='outline'>
                            {issue.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {issue.documentType && (
                            <Badge variant='outline'>
                              {issue.documentType === 'id_card'
                                ? '🆔 ID Card'
                                : '📕 Passport'}
                            </Badge>
                          )}
                          {issue.fixable && (
                            <Badge className='bg-green-100 text-green-800'>
                              Auto-Fixable
                            </Badge>
                          )}
                        </div>
                        <p className='text-sm font-medium'>
                          {issue.description}
                        </p>
                        {issue.promoterName && (
                          <p className='text-xs text-muted-foreground mt-1'>
                            Promoter: {issue.promoterName}
                          </p>
                        )}
                        {issue.fileUrl && (
                          <p className='text-xs text-muted-foreground mt-1 font-mono truncate'>
                            URL: {issue.fileUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
