'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import { Progress } from '@/components/ui/progress';

interface FixResult {
  promoterId: string;
  promoterName: string;
  fixedIdCard: boolean;
  fixedPassport: boolean;
  idCardUrl?: string;
  passportUrl?: string;
  error?: string;
}

function normalizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export default function QuickDocumentFixPage() {
  const [isClient, setIsClient] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPromoter, setCurrentPromoter] = useState('');
  const [results, setResults] = useState<FixResult[]>([]);
  const [summary, setSummary] = useState({
    totalFixed: 0,
    idCardsFixed: 0,
    passportsFixed: 0,
    errors: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const runQuickFix = async () => {
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
    setProgress(0);
    setResults([]);

    try {
      toast({
        title: 'Starting Quick Fix',
        description: 'Fetching promoters and matching documents...',
      });

      // Fetch all promoters
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url');

      if (promotersError) {
        throw new Error(`Failed to fetch promoters: ${promotersError.message}`);
      }

      if (!promoters || promoters.length === 0) {
        toast({
          title: 'No Data',
          description: 'No promoters found to process',
        });
        return;
      }

      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fixedResults: FixResult[] = [];
      const totalPromoters = promoters.length;

      for (let i = 0; i < promoters.length; i++) {
        const promoter = promoters[i];
        if (!promoter) continue;
        
        setCurrentPromoter(promoter.name_en || '');
        setProgress(Math.round(((i + 1) / totalPromoters) * 100));

        const result: FixResult = {
          promoterId: promoter.id,
          promoterName: promoter.name_en || '',
          fixedIdCard: false,
          fixedPassport: false,
        };

        try {
          const updates: any = {};

          // Fix ID Card URL if missing
          if (!promoter.id_card_url && promoter.id_card_number) {
            const normalizedName = normalizeFilename(promoter.name_en || '');
            const possibleNames = [
              `${normalizedName}_${promoter.id_card_number}.png`,
              `${normalizedName}_${promoter.id_card_number}.jpeg`,
              `${normalizedName}_${promoter.id_card_number}.jpg`,
            ];

            for (const filename of possibleNames) {
              const testUrl = `${projectUrl}/storage/v1/object/public/promoter-documents/${filename}`;
              
              // Quick check if file exists by attempting to fetch head
              try {
                const response = await fetch(testUrl, { method: 'HEAD' });
                if (response.ok) {
                  updates.id_card_url = testUrl;
                  result.fixedIdCard = true;
                  result.idCardUrl = testUrl;
                  break;
                }
              } catch {
                // File doesn't exist, try next pattern
              }
            }
          }

          // Fix Passport URL if missing
          if (!promoter.passport_url && promoter.passport_number) {
            const normalizedName = normalizeFilename(promoter.name_en);
            const possibleNames = [
              `${normalizedName}_${promoter.passport_number}.png`,
              `${normalizedName}_${promoter.passport_number}.jpeg`,
              `${normalizedName}_${promoter.passport_number.toUpperCase()}.png`,
              `${normalizedName}_${promoter.passport_number.toUpperCase()}.jpeg`,
              `${normalizedName}_NO_PASSPORT.png`,
              `${normalizedName}_NO_PASSPORT.jpeg`,
            ];

            for (const filename of possibleNames) {
              const testUrl = `${projectUrl}/storage/v1/object/public/promoter-documents/${filename}`;
              
              try {
                const response = await fetch(testUrl, { method: 'HEAD' });
                if (response.ok) {
                  updates.passport_url = testUrl;
                  result.fixedPassport = true;
                  result.passportUrl = testUrl;
                  break;
                }
              } catch {
                // File doesn't exist, try next pattern
              }
            }
          }

          // Update database if we found any URLs
          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('promoters')
              .update(updates)
              .eq('id', promoter.id);

            if (updateError) {
              result.error = updateError.message;
            } else {
              fixedResults.push(result);
            }
          }
        } catch (err) {
          result.error = err instanceof Error ? err.message : 'Unknown error';
          if (result.fixedIdCard || result.fixedPassport) {
            fixedResults.push(result);
          }
        }
      }

      setResults(fixedResults);
      setSummary({
        totalFixed: fixedResults.length,
        idCardsFixed: fixedResults.filter(r => r.fixedIdCard).length,
        passportsFixed: fixedResults.filter(r => r.fixedPassport).length,
        errors: fixedResults.filter(r => r.error).length,
      });

      toast({
        title: '✅ Quick Fix Complete!',
        description: `Fixed ${fixedResults.length} promoters: ${fixedResults.filter(r => r.fixedIdCard).length} ID cards, ${fixedResults.filter(r => r.fixedPassport).length} passports`,
      });
    } catch (error) {
      console.error('Quick fix error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run quick fix',
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
      setProgress(0);
      setCurrentPromoter('');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>⚡ Quick Document Fix</h1>
        <p className='text-muted-foreground mt-2'>
          Automatically find and link documents from storage (No special permissions needed!)
        </p>
      </div>

      {/* Action Card */}
      <Card className='border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-6 w-6 text-green-600' />
            Quick Document Matching
          </CardTitle>
          <CardDescription>
            This tool runs in your browser with your permissions and will:
            <ul className='list-disc list-inside mt-2 space-y-1'>
              <li>Scan all promoters with missing document URLs</li>
              <li>Try to find matching files in storage</li>
              <li>Automatically update the database</li>
              <li>Show you real-time progress</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            onClick={runQuickFix}
            disabled={fixing}
            size='lg'
            className='w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          >
            {fixing ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Fixing Documents... {progress}%
              </>
            ) : (
              <>
                <Zap className='mr-2 h-5 w-5' />
                Run Quick Fix
              </>
            )}
          </Button>

          {fixing && (
            <div className='space-y-2'>
              <Progress value={progress} className='w-full' />
              <p className='text-sm text-muted-foreground'>
                Processing: {currentPromoter}
              </p>
            </div>
          )}

          <p className='text-xs text-muted-foreground'>
            ⏱️ This may take 3-8 minutes depending on the number of promoters and network speed
          </p>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {summary.totalFixed > 0 && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='pt-6 text-center'>
              <CheckCircle className='h-8 w-8 mx-auto text-green-600 mb-2' />
              <p className='text-3xl font-bold text-green-700'>{summary.totalFixed}</p>
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

          <Card className={summary.errors > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardContent className='pt-6 text-center'>
              <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${summary.errors > 0 ? 'text-red-600' : 'text-gray-400'}`} />
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
                          <h4 className='font-semibold'>{result.promoterName}</h4>
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
                            <Badge variant='destructive'>
                              Error
                            </Badge>
                          )}
                        </div>
                        
                        <div className='space-y-1 text-xs'>
                          {result.idCardUrl && (
                            <div>
                              <span className='text-muted-foreground'>ID Card: </span>
                              <a
                                href={result.idCardUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline'
                              >
                                View
                              </a>
                            </div>
                          )}
                          {result.passportUrl && (
                            <div>
                              <span className='text-muted-foreground'>Passport: </span>
                              <a
                                href={result.passportUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline'
                              >
                                View
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

      {/* Info */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardHeader>
          <CardTitle className='text-sm'>💡 How It Works</CardTitle>
        </CardHeader>
        <CardContent className='text-sm space-y-2'>
          <p>For each promoter with missing document URLs, this tool will:</p>
          <ol className='list-decimal list-inside ml-4 space-y-1'>
            <li>Generate possible filenames based on name + ID/passport number</li>
            <li>Check if those files exist in your storage</li>
            <li>Update the database with the correct URLs</li>
          </ol>
          <p className='text-xs text-muted-foreground mt-3'>
            ✅ Safe to run multiple times • ✅ Only updates missing URLs • ✅ Works with your permissions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

