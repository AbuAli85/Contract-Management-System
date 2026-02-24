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
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface VerificationResult {
  promoterId: string;
  promoterName: string;
  idCardExists: boolean;
  passportExists: boolean;
  idCardUrl?: string;
  passportUrl?: string;
  idCardBroken: boolean;
  passportBroken: boolean;
}

export default function VerifyDocumentUrlsPage() {
  const [isClient, setIsClient] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPromoter, setCurrentPromoter] = useState('');
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    validIdCards: 0,
    validPassports: 0,
    brokenIdCards: 0,
    brokenPassports: 0,
    complete: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkUrlExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const verifyAllUrls = async () => {
    const supabase = createClient();
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Supabase client not available',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: promoters, error } = await supabase
        .from('promoters')
        .select('id, name_en, id_card_url, passport_url');

      if (error) throw error;
      if (!promoters || promoters.length === 0) {
        toast({ title: 'No promoters found' });
        return;
      }

      const verificationResults: VerificationResult[] = [];
      let validIdCards = 0;
      let validPassports = 0;
      let brokenIdCards = 0;
      let brokenPassports = 0;

      for (let i = 0; i < promoters.length; i++) {
        const promoter = promoters[i];

        // Skip if promoter is undefined (TypeScript safety check)
        if (!promoter) continue;

        setCurrentPromoter(promoter.name_en || '');
        setProgress(Math.round(((i + 1) / promoters.length) * 100));

        const result: VerificationResult = {
          promoterId: promoter.id,
          promoterName: promoter.name_en || '',
          idCardExists: false,
          passportExists: false,
          idCardUrl: promoter.id_card_url,
          passportUrl: promoter.passport_url,
          idCardBroken: false,
          passportBroken: false,
        };

        // Check ID card URL
        if (promoter.id_card_url) {
          const exists = await checkUrlExists(promoter.id_card_url);
          result.idCardExists = exists;
          if (exists) {
            validIdCards++;
          } else {
            result.idCardBroken = true;
            brokenIdCards++;
          }
        }

        // Check passport URL
        if (promoter.passport_url) {
          const exists = await checkUrlExists(promoter.passport_url);
          result.passportExists = exists;
          if (exists) {
            validPassports++;
          } else {
            result.passportBroken = true;
            brokenPassports++;
          }
        }

        if (result.idCardBroken || result.passportBroken) {
          verificationResults.push(result);
        }
      }

      const complete = promoters.filter(
        p => p.id_card_url && p.passport_url
      ).length;

      setStats({
        total: promoters.length,
        validIdCards,
        validPassports,
        brokenIdCards,
        brokenPassports,
        complete,
      });

      setResults(verificationResults);

      toast({
        title: 'Verification Complete',
        description: `Found ${brokenIdCards + brokenPassports} broken URLs`,
        variant:
          brokenIdCards + brokenPassports > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify URLs',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
      setProgress(0);
      setCurrentPromoter('');
    }
  };

  const cleanupBrokenUrls = async () => {
    const supabase = createClient();
    if (!supabase) return;

    setCleaning(true);

    try {
      let fixedCount = 0;

      for (const result of results) {
        const updates: any = {};

        if (result.idCardBroken) {
          updates.id_card_url = null;
        }

        if (result.passportBroken) {
          updates.passport_url = null;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('promoters')
            .update(updates)
            .eq('id', result.promoterId);

          if (!error) fixedCount++;
        }
      }

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${fixedCount} broken URLs`,
      });

      // Re-verify after cleanup
      await verifyAllUrls();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup broken URLs',
        variant: 'destructive',
      });
    } finally {
      setCleaning(false);
    }
  };

  if (!isClient) return null;

  const brokenCount = stats.brokenIdCards + stats.brokenPassports;
  const actualCompletion =
    stats.total > 0
      ? ((stats.validIdCards / stats.total) * 100).toFixed(1)
      : '0';

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Verify Document URLs
          </h1>
          <p className='text-muted-foreground mt-2'>
            Check which document URLs actually point to existing files
          </p>
        </div>
        <div className='flex gap-3'>
          <Button
            onClick={verifyAllUrls}
            disabled={verifying}
            variant='outline'
          >
            {verifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verifying... {progress}%
              </>
            ) : (
              'Start Verification'
            )}
          </Button>
          {brokenCount > 0 && (
            <Button
              onClick={cleanupBrokenUrls}
              disabled={cleaning}
              variant='destructive'
            >
              {cleaning ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Cleaning...
                </>
              ) : (
                `Remove Broken URLs (${brokenCount})`
              )}
            </Button>
          )}
        </div>
      </div>

      {verifying && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='pt-6'>
            <Progress value={progress} className='mb-2' />
            <p className='text-sm text-muted-foreground'>
              Checking: {currentPromoter}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5'>
          <Card>
            <CardContent className='pt-6 text-center'>
              <p className='text-3xl font-bold'>{stats.total}</p>
              <p className='text-xs text-muted-foreground'>Total Promoters</p>
            </CardContent>
          </Card>

          <Card className='border-green-200 bg-green-50'>
            <CardContent className='pt-6 text-center'>
              <CheckCircle className='h-6 w-6 mx-auto text-green-600 mb-1' />
              <p className='text-3xl font-bold text-green-700'>
                {stats.validIdCards}
              </p>
              <p className='text-xs text-muted-foreground'>Valid ID Cards</p>
            </CardContent>
          </Card>

          <Card className='border-green-200 bg-green-50'>
            <CardContent className='pt-6 text-center'>
              <CheckCircle className='h-6 w-6 mx-auto text-green-600 mb-1' />
              <p className='text-3xl font-bold text-green-700'>
                {stats.validPassports}
              </p>
              <p className='text-xs text-muted-foreground'>Valid Passports</p>
            </CardContent>
          </Card>

          <Card className='border-red-200 bg-red-50'>
            <CardContent className='pt-6 text-center'>
              <XCircle className='h-6 w-6 mx-auto text-red-600 mb-1' />
              <p className='text-3xl font-bold text-red-700'>
                {stats.brokenIdCards}
              </p>
              <p className='text-xs text-muted-foreground'>Broken ID URLs</p>
            </CardContent>
          </Card>

          <Card className='border-red-200 bg-red-50'>
            <CardContent className='pt-6 text-center'>
              <XCircle className='h-6 w-6 mx-auto text-red-600 mb-1' />
              <p className='text-3xl font-bold text-red-700'>
                {stats.brokenPassports}
              </p>
              <p className='text-xs text-muted-foreground'>
                Broken Passport URLs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actual Completion */}
      {stats.total > 0 && (
        <Card
          className={
            brokenCount > 0
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
          }
        >
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-5xl font-bold'>{actualCompletion}%</p>
              <p className='text-sm text-muted-foreground mt-2'>
                Actual Document Completion Rate
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                ({stats.validIdCards} valid ID cards out of {stats.total}{' '}
                promoters)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broken URLs List */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Broken URLs Found ({results.length})</CardTitle>
            <CardDescription>
              These URLs are in the database but files don't exist in storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 max-h-[600px] overflow-y-auto'>
              {results.map((result, index) => (
                <Card key={index} className='border-l-4 border-l-red-500'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-semibold mb-2'>
                          {result.promoterName}
                        </h4>

                        <div className='space-y-2 text-xs'>
                          {result.idCardBroken && (
                            <div className='flex items-center gap-2'>
                              <XCircle className='h-4 w-4 text-red-600' />
                              <span className='text-red-600'>
                                ID Card: File not found
                              </span>
                            </div>
                          )}

                          {result.passportBroken && (
                            <div className='flex items-center gap-2'>
                              <XCircle className='h-4 w-4 text-red-600' />
                              <span className='text-red-600'>
                                Passport: File not found
                              </span>
                            </div>
                          )}

                          {result.idCardUrl && (
                            <div className='mt-1'>
                              <p className='text-muted-foreground font-mono truncate'>
                                {result.idCardUrl}
                              </p>
                            </div>
                          )}

                          {result.passportUrl && result.passportBroken && (
                            <div className='mt-1'>
                              <p className='text-muted-foreground font-mono truncate'>
                                {result.passportUrl}
                              </p>
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

      {/* Instructions */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardHeader>
          <CardTitle className='text-sm'>💡 What This Tool Does</CardTitle>
        </CardHeader>
        <CardContent className='text-sm space-y-2'>
          <p>
            <strong>Verification:</strong> Checks every document URL to see if
            the file actually exists in storage
          </p>
          <p>
            <strong>Cleanup:</strong> Removes broken URLs from database (sets
            them to NULL)
          </p>
          <p className='text-xs text-muted-foreground mt-3'>
            This ensures your database only contains valid, working URLs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
