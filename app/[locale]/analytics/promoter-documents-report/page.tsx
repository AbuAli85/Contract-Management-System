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
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
} from 'lucide-react';
import type { Party, Promoter } from '@/lib/types';

interface PromoterWithEmployer extends Promoter {
  employer?: Party | null;
  hasIdCard: boolean;
  hasPassport: boolean;
  documentStatus: 'complete' | 'partial' | 'missing';
}

interface DocumentStats {
  total: number;
  complete: number;
  partialDocs: number;
  noDocs: number;
  hasIdOnly: number;
  hasPassportOnly: number;
}

export default function PromoterDocumentsReportPage() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [promoters, setPromoters] = useState<PromoterWithEmployer[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    complete: 0,
    partialDocs: 0,
    noDocs: 0,
    hasIdOnly: 0,
    hasPassportOnly: 0,
  });
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'complete' | 'partial' | 'missing'
  >('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    async function fetchPromoterDocuments() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch all promoters
        const { data: promotersData, error: promotersError } = await supabase
          .from('promoters')
          .select('*')
          .order('name_en');

        if (promotersError) {

          setLoading(false);
          return;
        }

        // Fetch all employers
        const { data: employers, error: employersError } = await supabase
          .from('parties')
          .select('*')
          .eq('type', 'Employer');

        if (employersError) {

        }

        // Create employer lookup map
        const employerMap = new Map(employers?.map(e => [e.id, e]) || []);

        // Process promoters with document status
        const processedPromoters: PromoterWithEmployer[] = (
          (promotersData as any[]) || []
        ).map(promoter => {
          const hasIdCard = !!(
            promoter.id_card_url && promoter.id_card_url.trim() !== ''
          );
          const hasPassport = !!(
            promoter.passport_url && promoter.passport_url.trim() !== ''
          );

          let documentStatus: 'complete' | 'partial' | 'missing';
          if (hasIdCard && hasPassport) {
            documentStatus = 'complete';
          } else if (hasIdCard || hasPassport) {
            documentStatus = 'partial';
          } else {
            documentStatus = 'missing';
          }

          return {
            ...promoter,
            employer: promoter.employer_id
              ? employerMap.get(promoter.employer_id)
              : null,
            hasIdCard,
            hasPassport,
            documentStatus,
          };
        });

        // Calculate statistics
        const complete = processedPromoters.filter(
          p => p.documentStatus === 'complete'
        ).length;
        const partial = processedPromoters.filter(
          p => p.documentStatus === 'partial'
        ).length;
        const missing = processedPromoters.filter(
          p => p.documentStatus === 'missing'
        ).length;
        const idOnly = processedPromoters.filter(
          p => p.hasIdCard && !p.hasPassport
        ).length;
        const passportOnly = processedPromoters.filter(
          p => !p.hasIdCard && p.hasPassport
        ).length;

        setStats({
          total: processedPromoters.length,
          complete,
          partialDocs: partial,
          noDocs: missing,
          hasIdOnly: idOnly,
          hasPassportOnly: passportOnly,
        });

        setPromoters(processedPromoters);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    }

    fetchPromoterDocuments();
  }, [isClient]);

  const exportToCSV = () => {
    const headers = [
      'Promoter Name (EN)',
      'Promoter Name (AR)',
      'Employer Name (EN)',
      'Employer Name (AR)',
      'Employer CRN',
      'ID Card Number',
      'ID Card URL',
      'ID Card Status',
      'Passport Number',
      'Passport URL',
      'Passport Status',
      'Document Status',
      'Email',
      'Phone',
      'Status',
    ];

    const rows = filteredPromoters.map(p => [
      p.name_en || '',
      p.name_ar || '',
      p.employer?.name_en || 'Not Assigned',
      p.employer?.name_ar || '',
      p.employer?.crn || '',
      p.id_card_number || '',
      p.id_card_url || '',
      p.hasIdCard ? 'Available' : 'Missing',
      p.passport_number || '',
      p.passport_url || '',
      p.hasPassport ? 'Available' : 'Missing',
      p.documentStatus.toUpperCase(),
      p.email || '',
      p.phone || p.mobile_number || '',
      p.status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promoter-documents-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredPromoters = promoters.filter(p => {
    if (filterStatus === 'all') return true;
    return p.documentStatus === filterStatus;
  });

  if (!isClient || loading) {
    return (
      <div className='flex h-[calc(100vh-150px)] items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading promoter documents report...</p>
      </div>
    );
  }

  const completionPercentage =
    stats.total > 0 ? ((stats.complete / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Promoter Documents Report
        </h1>
        <p className='text-muted-foreground mt-2'>
          Comprehensive review of promoters, their employers, and document
          completion status
        </p>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <FileText className='h-8 w-8 mx-auto text-blue-500 mb-2' />
              <p className='text-3xl font-bold'>{stats.total}</p>
              <p className='text-xs text-muted-foreground mt-1'>
                Total Promoters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-green-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <CheckCircle2 className='h-8 w-8 mx-auto text-green-600 mb-2' />
              <p className='text-3xl font-bold text-green-700'>
                {stats.complete}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Complete Documents
              </p>
              <p className='text-xs font-semibold text-green-600'>
                {completionPercentage}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-yellow-200 bg-yellow-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <AlertCircle className='h-8 w-8 mx-auto text-yellow-600 mb-2' />
              <p className='text-3xl font-bold text-yellow-700'>
                {stats.partialDocs}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Partial Documents
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-red-200 bg-red-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <XCircle className='h-8 w-8 mx-auto text-red-600 mb-2' />
              <p className='text-3xl font-bold text-red-700'>{stats.noDocs}</p>
              <p className='text-xs text-muted-foreground mt-1'>No Documents</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-2xl mb-2'>🆔</div>
              <p className='text-3xl font-bold'>{stats.hasIdOnly}</p>
              <p className='text-xs text-muted-foreground mt-1'>ID Card Only</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-2xl mb-2'>📕</div>
              <p className='text-3xl font-bold'>{stats.hasPassportOnly}</p>
              <p className='text-xs text-muted-foreground mt-1'>
                Passport Only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Promoter Documents List</CardTitle>
              <CardDescription>
                {filteredPromoters.length} promoter
                {filteredPromoters.length !== 1 ? 's' : ''} shown
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant='outline'>
              <Download className='h-4 w-4 mr-2' />
              Export CSV
            </Button>
          </div>
          <div className='flex gap-2 mt-4'>
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterStatus('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filterStatus === 'complete' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterStatus('complete')}
              className='border-green-200'
            >
              Complete ({stats.complete})
            </Button>
            <Button
              variant={filterStatus === 'partial' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterStatus('partial')}
              className='border-yellow-200'
            >
              Partial ({stats.partialDocs})
            </Button>
            <Button
              variant={filterStatus === 'missing' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterStatus('missing')}
              className='border-red-200'
            >
              Missing ({stats.noDocs})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredPromoters.map(promoter => (
              <Card
                key={promoter.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardContent className='p-4'>
                  <div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
                    {/* Promoter Info */}
                    <div className='lg:col-span-3'>
                      <h3 className='font-semibold text-lg'>
                        {promoter.name_en}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {promoter.name_ar}
                      </p>
                      <div className='mt-2 space-y-1'>
                        <p className='text-xs'>
                          {promoter.email || 'No email'}
                        </p>
                        <p className='text-xs'>
                          {promoter.phone ||
                            promoter.mobile_number ||
                            'No phone'}
                        </p>
                      </div>
                    </div>

                    {/* Employer Info */}
                    <div className='lg:col-span-3'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Building2 className='h-4 w-4 text-muted-foreground' />
                        <span className='text-xs font-medium text-muted-foreground'>
                          EMPLOYER
                        </span>
                      </div>
                      {promoter.employer ? (
                        <>
                          <p className='font-medium'>
                            {promoter.employer.name_en}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {promoter.employer.name_ar}
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            CRN: {promoter.employer.crn}
                          </p>
                        </>
                      ) : (
                        <p className='text-sm text-muted-foreground italic'>
                          Not assigned to employer
                        </p>
                      )}
                    </div>

                    {/* ID Card Status */}
                    <div className='lg:col-span-2'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-medium text-muted-foreground'>
                            ID CARD
                          </span>
                          {promoter.hasIdCard ? (
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                          ) : (
                            <XCircle className='h-4 w-4 text-red-600' />
                          )}
                        </div>
                        {promoter.id_card_number && (
                          <p className='text-sm'>#{promoter.id_card_number}</p>
                        )}
                        {promoter.hasIdCard ? (
                          <a
                            href={promoter.id_card_url!}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-xs text-blue-600 hover:underline'
                          >
                            View Document
                          </a>
                        ) : (
                          <p className='text-xs text-red-600'>Not uploaded</p>
                        )}
                      </div>
                    </div>

                    {/* Passport Status */}
                    <div className='lg:col-span-2'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-medium text-muted-foreground'>
                            PASSPORT
                          </span>
                          {promoter.hasPassport ? (
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                          ) : (
                            <XCircle className='h-4 w-4 text-red-600' />
                          )}
                        </div>
                        {promoter.passport_number && (
                          <p className='text-sm'>#{promoter.passport_number}</p>
                        )}
                        {promoter.hasPassport ? (
                          <a
                            href={promoter.passport_url!}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-xs text-blue-600 hover:underline'
                          >
                            View Document
                          </a>
                        ) : (
                          <p className='text-xs text-red-600'>Not uploaded</p>
                        )}
                      </div>
                    </div>

                    {/* Overall Status */}
                    <div className='lg:col-span-2 flex items-center justify-center'>
                      {promoter.documentStatus === 'complete' && (
                        <Badge className='bg-green-100 text-green-800 hover:bg-green-200'>
                          <CheckCircle2 className='h-3 w-3 mr-1' />
                          Complete
                        </Badge>
                      )}
                      {promoter.documentStatus === 'partial' && (
                        <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200'>
                          <AlertCircle className='h-3 w-3 mr-1' />
                          Partial
                        </Badge>
                      )}
                      {promoter.documentStatus === 'missing' && (
                        <Badge className='bg-red-100 text-red-800 hover:bg-red-200'>
                          <XCircle className='h-3 w-3 mr-1' />
                          Missing
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPromoters.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <FileText className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>No promoters found matching the selected filter</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
