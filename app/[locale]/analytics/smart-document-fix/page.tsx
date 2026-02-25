'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface FixResult {
  promoterId: string;
  promoterName: string;
  fixedIdCard: boolean;
  fixedPassport: boolean;
  idCardUrl?: string;
  passportUrl?: string;
  error?: string;
}

export default function SmartDocumentFixPage() {
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [summary, setSummary] = useState({
    totalFixed: 0,
    idCardsFixed: 0,
    passportsFixed: 0,
    errors: 0,
  });
  const { toast } = useToast();

  const runSmartFix = async () => {
    setFixing(true);
    setResults([]);

    try {
      toast({
        title: 'Starting Smart Fix',
        description: 'Scanning storage and matching documents to promoters...',
      });

      const response = await fetch('/api/analytics/bulk-fix-documents', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to run smart fix');
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.fixed);
        setSummary(data.summary);

        toast({
          title: '✅ Smart Fix Complete!',
          description: `Fixed ${data.summary.totalFixed} promoters: ${data.summary.idCardsFixed} ID cards, ${data.summary.passportsFixed} passports`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {

      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to run smart fix',
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Smart Document Fix
        </h1>
        <p className='text-muted-foreground mt-2'>
          Automatically find and link documents from storage to promoter records
        </p>
      </div>

      {/* Action Card */}
      <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-6 w-6 text-blue-600' />
            Intelligent Document Matching
          </CardTitle>
          <CardDescription>
            This tool will scan your Supabase storage and automatically match
            documents to promoters based on:
            <ul className='list-disc list-inside mt-2 space-y-1'>
              <li>Name matching (normalized)</li>
              <li>ID card numbers</li>
              <li>Passport numbers</li>
              <li>Multiple file format attempts (.png, .jpeg, .jpg)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runSmartFix}
            disabled={fixing}
            size='lg'
            className='w-full md:w-auto'
          >
            {fixing ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Fixing Documents...
              </>
            ) : (
              <>
                <Zap className='mr-2 h-5 w-5' />
                Run Smart Fix
              </>
            )}
          </Button>
          <p className='text-xs text-muted-foreground mt-2'>
            This may take 2-5 minutes depending on the number of promoters
          </p>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {summary.totalFixed > 0 && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='pt-6 text-center'>
              <CheckCircle className='h-8 w-8 mx-auto text-green-600 mb-2' />
              <p className='text-3xl font-bold text-green-700'>
                {summary.totalFixed}
              </p>
              <p className='text-xs text-muted-foreground'>Total Fixed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6 text-center'>
              <div className='text-2xl mb-2'>🆔</div>
              <p className='text-3xl font-bold'>{summary.idCardsFixed}</p>
              <p className='text-xs text-muted-foreground'>ID Cards Linked</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6 text-center'>
              <div className='text-2xl mb-2'>📕</div>
              <p className='text-3xl font-bold'>{summary.passportsFixed}</p>
              <p className='text-xs text-muted-foreground'>Passports Linked</p>
            </CardContent>
          </Card>

          <Card
            className={summary.errors > 0 ? 'border-red-200 bg-red-50' : ''}
          >
            <CardContent className='pt-6 text-center'>
              <AlertCircle
                className={`h-8 w-8 mx-auto mb-2 ${summary.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}
              />
              <p className='text-3xl font-bold'>{summary.errors}</p>
              <p className='text-xs text-muted-foreground'>Errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fixed Records ({results.length})</CardTitle>
            <CardDescription>
              Details of all successfully linked documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 max-h-[600px] overflow-y-auto'>
              {results.map((result, index) => (
                <Card key={index} className='border-l-4 border-l-green-500'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h4 className='font-semibold'>
                            {result.promoterName}
                          </h4>
                          {result.fixedIdCard && (
                            <Badge className='bg-green-100 text-green-800'>
                              🆔 ID Fixed
                            </Badge>
                          )}
                          {result.fixedPassport && (
                            <Badge className='bg-blue-100 text-blue-800'>
                              📕 Passport Fixed
                            </Badge>
                          )}
                          {result.error && (
                            <Badge variant='destructive'>Error</Badge>
                          )}
                        </div>

                        <div className='space-y-1 text-xs'>
                          {result.idCardUrl && (
                            <div>
                              <span className='text-muted-foreground'>
                                ID Card URL:{' '}
                              </span>
                              <a
                                href={result.idCardUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline truncate block'
                              >
                                {result.idCardUrl}
                              </a>
                            </div>
                          )}
                          {result.passportUrl && (
                            <div>
                              <span className='text-muted-foreground'>
                                Passport URL:{' '}
                              </span>
                              <a
                                href={result.passportUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline truncate block'
                              >
                                {result.passportUrl}
                              </a>
                            </div>
                          )}
                          {result.error && (
                            <div className='text-red-600'>
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <p>The Smart Fix tool will:</p>
          <ol className='list-decimal list-inside space-y-2 ml-4'>
            <li>Scan all promoters with missing document URLs</li>
            <li>
              For each promoter, construct possible filenames based on:
              <ul className='list-disc list-inside ml-6 mt-1'>
                <li>Normalized name + ID card number</li>
                <li>Normalized name + passport number</li>
                <li>Multiple file extensions (.png, .jpeg, .jpg)</li>
              </ul>
            </li>
            <li>Search your Supabase storage for matching files</li>
            <li>Automatically update the database with found URLs</li>
            <li>Report all successful fixes and any errors</li>
          </ol>
          <p className='text-muted-foreground mt-4'>
            <strong>Note:</strong> This is safe to run multiple times. It only
            updates records with missing URLs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
